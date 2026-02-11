import type { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { nanoid } from 'nanoid';
import { WsMessageType } from '@share-it/shared';
import { getRoom } from '../db/repositories/rooms.js';
import {
  addPeerToRoom,
  removePeerFromRoom,
  getPeersInRoom,
  broadcastToRoom,
  getPeerConnection,
} from './rooms.js';
import { config } from '../config.js';

export function handleWsConnection(ws: WebSocket, req: IncomingMessage): void {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const roomId = url.searchParams.get('roomId');

  if (!roomId) {
    ws.close(4000, 'Missing roomId');
    return;
  }

  const room = getRoom(roomId);
  if (!room) {
    ws.close(4004, 'Room not found');
    return;
  }

  const peerId = nanoid(12);

  // Get existing peers before adding new one
  const existingPeers = getPeersInRoom(roomId).map(p => ({
    peerId: p.peerId,
    joinedAt: p.joinedAt,
  }));

  // Add peer to room
  const conn = addPeerToRoom(roomId, peerId, ws);

  // Build ICE servers config
  const iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [
    { urls: ['stun:stun.l.google.com:19302'] },
  ];
  if (config.turnServer) {
    iceServers.push({
      urls: config.turnServer,
      username: config.turnUsername,
      credential: config.turnCredential,
    });
  }

  // Send welcome
  ws.send(JSON.stringify({
    type: WsMessageType.Welcome,
    peerId,
    peers: existingPeers,
    iceServers,
  }));

  // Broadcast join to others
  broadcastToRoom(roomId, {
    type: WsMessageType.PeerJoin,
    peerId,
    joinedAt: conn.joinedAt,
  }, peerId);

  // Handle messages
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleMessage(roomId, peerId, msg, ws);
    } catch {
      // Ignore malformed messages
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    removePeerFromRoom(roomId, peerId);
    broadcastToRoom(roomId, {
      type: WsMessageType.PeerLeave,
      peerId,
    });
  });

  // Heartbeat
  ws.on('pong', () => {
    (ws as any).__alive = true;
  });
  (ws as any).__alive = true;
}

function handleMessage(roomId: string, fromPeerId: string, msg: any, _ws: WebSocket): void {
  switch (msg.type) {
    case WsMessageType.Ping:
      _ws.send(JSON.stringify({ type: WsMessageType.Pong }));
      break;

    case WsMessageType.SignalOffer:
    case WsMessageType.SignalAnswer:
    case WsMessageType.SignalIce: {
      const target = getPeerConnection(roomId, msg.to);
      if (target && target.ws.readyState === 1) {
        target.ws.send(JSON.stringify({
          ...msg,
          from: fromPeerId,
        }));
      }
      break;
    }

    case WsMessageType.ManifestAnnounce:
      broadcastToRoom(roomId, {
        type: WsMessageType.ManifestUpdate,
        peerId: fromPeerId,
        manifest: msg.manifest,
      }, fromPeerId);
      break;
  }
}

// Heartbeat interval
export function startHeartbeat(wss: import('ws').WebSocketServer): NodeJS.Timeout {
  return setInterval(() => {
    wss.clients.forEach((ws) => {
      if ((ws as any).__alive === false) {
        ws.terminate();
        return;
      }
      (ws as any).__alive = false;
      ws.ping();
    });
  }, 30_000);
}
