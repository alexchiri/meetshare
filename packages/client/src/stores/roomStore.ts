import { create } from 'zustand';
import type { ContentItem, RoomResponse } from '@share-it/shared';

interface RoomState {
  room: RoomResponse | null;
  content: ContentItem[];
  nextCursor?: string;
  loading: boolean;
  error: string | null;

  setRoom: (room: RoomResponse) => void;
  setContent: (items: ContentItem[], nextCursor?: string) => void;
  addContent: (item: ContentItem) => void;
  prependContent: (items: ContentItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  content: [],
  nextCursor: undefined,
  loading: false,
  error: null,

  setRoom: (room) => set({ room }),
  setContent: (items, nextCursor) => set({ content: items, nextCursor }),
  addContent: (item) =>
    set((state) => ({
      content: [item, ...state.content.filter(c => c.id !== item.id)],
    })),
  prependContent: (items) =>
    set((state) => ({
      content: [...items, ...state.content],
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      room: null,
      content: [],
      nextCursor: undefined,
      loading: false,
      error: null,
    }),
}));
