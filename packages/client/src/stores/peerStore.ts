import { create } from 'zustand';

interface PeerInfo {
  peerId: string;
  joinedAt: string;
}

interface PeerState {
  localPeerId: string | null;
  peers: Map<string, PeerInfo>;

  setLocalPeerId: (id: string) => void;
  addPeer: (peerId: string, joinedAt: string) => void;
  removePeer: (peerId: string) => void;
  reset: () => void;
}

export const usePeerStore = create<PeerState>((set) => ({
  localPeerId: null,
  peers: new Map(),

  setLocalPeerId: (id) => set({ localPeerId: id }),

  addPeer: (peerId, joinedAt) =>
    set((state) => {
      const peers = new Map(state.peers);
      peers.set(peerId, { peerId, joinedAt });
      return { peers };
    }),

  removePeer: (peerId) =>
    set((state) => {
      const peers = new Map(state.peers);
      peers.delete(peerId);
      return { peers };
    }),

  reset: () => set({ localPeerId: null, peers: new Map() }),
}));
