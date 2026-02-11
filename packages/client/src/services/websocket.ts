import {
  WsMessageType,
  WS_HEARTBEAT_INTERVAL,
  WS_RECONNECT_BASE_DELAY,
  WS_RECONNECT_MAX_DELAY,
} from '@share-it/shared';
import type { WsServerMessage } from '@share-it/shared';

export type WsMessageHandler = (msg: WsServerMessage) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private roomId: string;
  private handlers = new Set<WsMessageHandler>();
  private reconnectDelay = WS_RECONNECT_BASE_DELAY;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private closed = false;

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  connect(): void {
    this.closed = false;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws?roomId=${this.roomId}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectDelay = WS_RECONNECT_BASE_DELAY;
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsServerMessage;
        this.handlers.forEach((h) => h(msg));
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.stopPing();
      if (!this.closed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // Will trigger onclose
    };
  }

  send(msg: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  onMessage(handler: WsMessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect(): void {
    this.closed = true;
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      this.send({ type: WsMessageType.Ping });
    }, WS_HEARTBEAT_INTERVAL);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, WS_RECONNECT_MAX_DELAY);
  }
}
