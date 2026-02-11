import { WsMessageType, MAX_MESH_PEERS } from '@share-it/shared';
import type { WebSocketService } from './websocket';

export interface PeerConnection {
  peerId: string;
  pc: RTCPeerConnection;
  controlChannel: RTCDataChannel | null;
  transferChannel: RTCDataChannel | null;
}

type ChannelHandler = (peerId: string, channel: RTCDataChannel) => void;

export class WebRTCService {
  private connections = new Map<string, PeerConnection>();
  private wsService: WebSocketService;
  private localPeerId = '';
  private iceServers: RTCIceServer[] = [];
  private onControlChannel: ChannelHandler | null = null;
  private onTransferChannel: ChannelHandler | null = null;
  private unsubWs: (() => void) | null = null;

  constructor(wsService: WebSocketService) {
    this.wsService = wsService;
  }

  init(peerId: string, iceServers: RTCIceServer[]): void {
    this.localPeerId = peerId;
    this.iceServers = iceServers;

    this.unsubWs = this.wsService.onMessage((msg) => {
      switch (msg.type) {
        case WsMessageType.SignalOffer:
          this.handleOffer(msg.from, msg.offer);
          break;
        case WsMessageType.SignalAnswer:
          this.handleAnswer(msg.from, msg.answer);
          break;
        case WsMessageType.SignalIce:
          this.handleIce(msg.from, msg.candidate);
          break;
      }
    });
  }

  setChannelHandlers(onControl: ChannelHandler, onTransfer: ChannelHandler): void {
    this.onControlChannel = onControl;
    this.onTransferChannel = onTransfer;
  }

  async connectToPeer(peerId: string): Promise<void> {
    if (this.connections.has(peerId)) return;
    if (this.connections.size >= MAX_MESH_PEERS) return;

    // Lower peerId initiates
    if (this.localPeerId > peerId) return;

    const pc = this.createPeerConnection(peerId);
    const conn = this.getOrCreateConn(peerId, pc);

    // Create data channels
    const controlChannel = pc.createDataChannel('control', { ordered: true });
    const transferChannel = pc.createDataChannel('transfer', { ordered: true });
    transferChannel.binaryType = 'arraybuffer';

    conn.controlChannel = controlChannel;
    conn.transferChannel = transferChannel;

    controlChannel.onopen = () => this.onControlChannel?.(peerId, controlChannel);
    transferChannel.onopen = () => this.onTransferChannel?.(peerId, transferChannel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.wsService.send({
      type: WsMessageType.SignalOffer,
      to: peerId,
      offer: { type: offer.type, sdp: offer.sdp },
    });
  }

  disconnectPeer(peerId: string): void {
    const conn = this.connections.get(peerId);
    if (conn) {
      conn.controlChannel?.close();
      conn.transferChannel?.close();
      conn.pc.close();
      this.connections.delete(peerId);
    }
  }

  getConnection(peerId: string): PeerConnection | undefined {
    return this.connections.get(peerId);
  }

  getAllConnections(): PeerConnection[] {
    return Array.from(this.connections.values());
  }

  destroy(): void {
    this.unsubWs?.();
    for (const [, conn] of this.connections) {
      conn.controlChannel?.close();
      conn.transferChannel?.close();
      conn.pc.close();
    }
    this.connections.clear();
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.wsService.send({
          type: WsMessageType.SignalIce,
          to: peerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.connections.delete(peerId);
      }
    };

    pc.ondatachannel = (event) => {
      const channel = event.channel;
      const conn = this.connections.get(peerId);
      if (!conn) return;

      if (channel.label === 'control') {
        conn.controlChannel = channel;
        channel.onopen = () => this.onControlChannel?.(peerId, channel);
      } else if (channel.label === 'transfer') {
        conn.transferChannel = channel;
        channel.binaryType = 'arraybuffer';
        channel.onopen = () => this.onTransferChannel?.(peerId, channel);
      }
    };

    return pc;
  }

  private getOrCreateConn(peerId: string, pc: RTCPeerConnection): PeerConnection {
    let conn = this.connections.get(peerId);
    if (!conn) {
      conn = { peerId, pc, controlChannel: null, transferChannel: null };
      this.connections.set(peerId, conn);
    }
    return conn;
  }

  private async handleOffer(from: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.createPeerConnection(from);
    this.getOrCreateConn(from, pc);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.wsService.send({
      type: WsMessageType.SignalAnswer,
      to: from,
      answer: { type: answer.type, sdp: answer.sdp },
    });
  }

  private async handleAnswer(from: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const conn = this.connections.get(from);
    if (conn) {
      await conn.pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  private async handleIce(from: string, candidate: RTCIceCandidateInit): Promise<void> {
    const conn = this.connections.get(from);
    if (conn) {
      await conn.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }
}
