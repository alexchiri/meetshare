import { useEffect } from 'react';
import { useRoomStore } from '../stores/roomStore';
import * as api from '../services/api';

export function useRoom(roomId: string) {
  const { room, content, loading, error, setRoom, setContent, setLoading, setError, reset } =
    useRoomStore();

  useEffect(() => {
    reset();
    loadRoom();
    return () => reset();
  }, [roomId]);

  async function loadRoom() {
    setLoading(true);
    try {
      const [roomData, contentData] = await Promise.all([
        api.getRoom(roomId),
        api.getContent(roomId),
      ]);
      setRoom(roomData);
      setContent(contentData.items, contentData.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load room');
    } finally {
      setLoading(false);
    }
  }

  return { room, content, loading, error, reload: loadRoom };
}
