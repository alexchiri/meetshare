import { useState, useCallback } from 'react';
import * as api from '../services/api';
import { cacheContentMeta, cacheContentBlob, evictLRU } from '../services/idb';

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}

export function useFileUpload(roomId: string) {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
  });

  const upload = useCallback(
    async (file: File) => {
      setState({ uploading: true, progress: 0, error: null });
      try {
        const item = await api.uploadFile(roomId, file, (pct) => {
          setState((s) => ({ ...s, progress: pct }));
        });

        // Cache to IndexedDB
        const blob = await file.arrayBuffer();
        await cacheContentMeta(item);
        await cacheContentBlob(item.id, blob);
        await evictLRU();

        setState({ uploading: false, progress: 100, error: null });
        return item;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setState({ uploading: false, progress: 0, error: message });
        throw err;
      }
    },
    [roomId],
  );

  return { ...state, upload };
}
