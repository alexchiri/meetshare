import { useEffect, useRef } from 'react';
import { WsMessageType } from '@share-it/shared';
import type { P2PControlMessage } from '@share-it/shared';
import { WebRTCService } from '../services/webrtc';
import { P2PTransferService } from '../services/p2p-transfer';
import type { WebSocketService } from '../services/websocket';
import { usePeerStore } from '../stores/peerStore';
import { getLocalManifest } from '../services/idb';

export function useWebRTC(
  roomId: string,
  wsRef: React.RefObject<WebSocketService | null>,
) {
  const webrtcRef = useRef<WebRTCService | null>(null);
  const p2pRef = useRef<P2PTransferService | null>(null);
  const localPeerId = usePeerStore((s) => s.localPeerId);
  const peers = usePeerStore((s) => s.peers);
  const setPeerConnected = usePeerStore((s) => s.setPeerConnected);

  useEffect(() => {
    if (!wsRef.current || !localPeerId) return;

    const ws = wsRef.current;
    const webrtc = new WebRTCService(ws);
    const p2p = new P2PTransferService(webrtc);
    webrtcRef.current = webrtc;
    p2pRef.current = p2p;

    // Listen for welcome to get ICE servers
    const unsub = ws.onMessage((msg) => {
      if (msg.type === WsMessageType.Welcome) {
        webrtc.init(msg.peerId, msg.iceServers as RTCIceServer[]);

        webrtc.setChannelHandlers(
          // Control channel opened
          (peerId, channel) => {
            setPeerConnected(peerId, true);
            channel.onmessage = (e) => {
              try {
                const ctrlMsg = JSON.parse(e.data) as P2PControlMessage;
                p2p.handleControlMessage(peerId, ctrlMsg);
              } catch {
                // ignore
              }
            };
            // Exchange manifests
            getLocalManifest(roomId).then((manifest) => {
              p2p.setLocalManifest(manifest);
              channel.send(JSON.stringify({
                type: 'manifest:exchange',
                manifest,
              }));
            });
          },
          // Transfer channel opened
          (peerId, channel) => {
            channel.onmessage = (e) => {
              if (e.data instanceof ArrayBuffer) {
                p2p.handleTransferData(peerId, e.data);
              }
            };
          },
        );

        // Connect to existing peers
        for (const peer of msg.peers) {
          webrtc.connectToPeer(peer.peerId);
        }
      }

      if (msg.type === WsMessageType.PeerJoin) {
        webrtc.connectToPeer(msg.peerId);
      }

      if (msg.type === WsMessageType.PeerLeave) {
        webrtc.disconnectPeer(msg.peerId);
        p2p.removePeer(msg.peerId);
        setPeerConnected(msg.peerId, false);
      }

      if (msg.type === WsMessageType.ManifestUpdate) {
        p2p.updatePeerManifest(msg.peerId, msg.manifest);
      }
    });

    return () => {
      unsub();
      webrtc.destroy();
      webrtcRef.current = null;
      p2pRef.current = null;
    };
  }, [roomId, localPeerId]);

  return { webrtcRef, p2pRef };
}
