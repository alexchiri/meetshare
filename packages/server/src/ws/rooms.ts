import type { WebSocket } from 'ws';

interface PeerConnection {
  ws: WebSocket;
  peerId: string;
  roomId: string;
  joinedAt: string;
}

// roomId -> Map<peerId, PeerConnection>
const rooms = new Map<string, Map<string, PeerConnection>>();

export function addPeerToRoom(roomId: string, peerId: string, ws: WebSocket): PeerConnection {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }
  const conn: PeerConnection = {
    ws,
    peerId,
    roomId,
    joinedAt: new Date().toISOString(),
  };
  rooms.get(roomId)!.set(peerId, conn);
  return conn;
}

export function removePeerFromRoom(roomId: string, peerId: string): void {
  const room = rooms.get(roomId);
  if (room) {
    room.delete(peerId);
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  }
}

export function getPeersInRoom(roomId: string): PeerConnection[] {
  const room = rooms.get(roomId);
  return room ? Array.from(room.values()) : [];
}

export function getPeerCount(roomId: string): number {
  return rooms.get(roomId)?.size ?? 0;
}

export function broadcastToRoom(roomId: string, message: object, excludePeerId?: string): void {
  const peers = getPeersInRoom(roomId);
  const data = JSON.stringify(message);
  for (const peer of peers) {
    if (peer.peerId !== excludePeerId && peer.ws.readyState === 1) {
      peer.ws.send(data);
    }
  }
}
