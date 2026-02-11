import { useEffect, useRef } from 'react';
import { WsMessageType } from '@share-it/shared';
import { WebSocketService } from '../services/websocket';
import { useRoomStore } from '../stores/roomStore';
import { usePeerStore } from '../stores/peerStore';

export function useWebSocket(roomId: string) {
  const wsRef = useRef<WebSocketService | null>(null);
  const addContent = useRoomStore((s) => s.addContent);
  const { setLocalPeerId, addPeer, removePeer, reset: resetPeers } = usePeerStore();

  useEffect(() => {
    const ws = new WebSocketService(roomId);
    wsRef.current = ws;

    const unsub = ws.onMessage((msg) => {
      switch (msg.type) {
        case WsMessageType.Welcome:
          setLocalPeerId(msg.peerId);
          for (const peer of msg.peers) {
            addPeer(peer.peerId, peer.joinedAt);
          }
          break;

        case WsMessageType.PeerJoin:
          addPeer(msg.peerId, msg.joinedAt);
          break;

        case WsMessageType.PeerLeave:
          removePeer(msg.peerId);
          break;

        case WsMessageType.ContentNew:
          addContent(msg.item);
          break;
      }
    });

    ws.connect();

    return () => {
      unsub();
      ws.disconnect();
      resetPeers();
      wsRef.current = null;
    };
  }, [roomId]);

  return wsRef;
}
