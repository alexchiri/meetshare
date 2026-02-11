import { create } from 'zustand';

interface PeerInfo {
  peerId: string;
  joinedAt: string;
  connected: boolean; // WebRTC connected
}

interface PeerState {
  localPeerId: string | null;
  peers: Map<string, PeerInfo>;

  setLocalPeerId: (id: string) => void;
  addPeer: (peerId: string, joinedAt: string) => void;
  removePeer: (peerId: string) => void;
  setPeerConnected: (peerId: string, connected: boolean) => void;
  reset: () => void;
}

export const usePeerStore = create<PeerState>((set) => ({
  localPeerId: null,
  peers: new Map(),

  setLocalPeerId: (id) => set({ localPeerId: id }),

  addPeer: (peerId, joinedAt) =>
    set((state) => {
      const peers = new Map(state.peers);
      peers.set(peerId, { peerId, joinedAt, connected: false });
      return { peers };
    }),

  removePeer: (peerId) =>
    set((state) => {
      const peers = new Map(state.peers);
      peers.delete(peerId);
      return { peers };
    }),

  setPeerConnected: (peerId, connected) =>
    set((state) => {
      const peers = new Map(state.peers);
      const peer = peers.get(peerId);
      if (peer) {
        peers.set(peerId, { ...peer, connected });
      }
      return { peers };
    }),

  reset: () => set({ localPeerId: null, peers: new Map() }),
}));
