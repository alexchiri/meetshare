import { useState, useRef, useCallback } from 'react';
import * as api from '../../services/api';
import { useFileUpload } from '../../hooks/useFileUpload';
import { showToast } from '../common/Toaster';
import styles from './ShareInput.module.css';

interface Props {
  roomId: string;
}

export default function ShareInput({ roomId }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, progress, upload } = useFileUpload(roomId);

  const isUrl = (s: string) => {
    try {
      new URL(s);
      return true;
    } catch {
      return false;
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      const type = isUrl(text.trim()) ? 'link' : 'text';
      await api.postTextContent(roomId, type, text.trim());
      setText('');
    } catch {
      showToast('Failed to share content', 'error');
    } finally {
      setSending(false);
    }
  }

  async function handleFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      try {
        await upload(file);
        showToast(`Uploaded ${file.name}`, 'success');
      } catch {
        showToast(`Failed to upload ${file.name}`, 'error');
      }
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [roomId],
  );

  return (
    <div
      className={`${styles.container} ${dragOver ? styles.dragOver : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          type="text"
          placeholder="Share a link, text, or drop a file..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
        />
        <button
          className={styles.fileBtn}
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Upload file"
        >
          {uploading ? `${progress}%` : 'File'}
        </button>
        <button className={styles.sendBtn} type="submit" disabled={!text.trim() || sending}>
          Send
        </button>
      </form>
      <input
        ref={fileInputRef}
        type="file"
        className={styles.hidden}
        multiple
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      {dragOver && <div className={styles.dropOverlay}>Drop files to share</div>}
    </div>
  );
}
