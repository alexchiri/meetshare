import { useState } from 'react';
import type { ContentItem } from '@share-it/shared';
import type { P2PTransferService } from '../../services/p2p-transfer';
import { getFileUrl } from '../../services/api';
import { getCachedBlob } from '../../services/idb';
import { showToast } from '../common/Toaster';
import styles from './ContentCard.module.css';

interface Props {
  item: ContentItem;
  roomId: string;
  p2pRef: React.RefObject<P2PTransferService | null>;
}

export default function ContentCard({ item, roomId, p2pRef }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [p2pProgress, setP2pProgress] = useState<number | null>(null);
  const isPurged = item.purgedAt != null;

  function formatSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);

    try {
      // Try local cache first
      const cached = await getCachedBlob(item.id);
      if (cached) {
        downloadBlob(cached, item.fileName || 'download');
        return;
      }

      if (!isPurged) {
        // Download from server
        window.open(getFileUrl(roomId, item.id), '_blank');
      } else {
        // Try P2P
        if (p2pRef.current && item.fileHash) {
          const blob = await p2pRef.current.requestFile(
            item.id,
            item.fileHash,
            (pct) => setP2pProgress(pct),
          );
          if (blob) {
            downloadBlob(blob, item.fileName || 'download');
          } else {
            showToast('No peers have this file available', 'error');
          }
        } else {
          showToast('File purged — no peers available', 'error');
        }
      }
    } catch {
      showToast('Download failed', 'error');
    } finally {
      setDownloading(false);
      setP2pProgress(null);
    }
  }

  function downloadBlob(buffer: ArrayBuffer, filename: string) {
    const blob = new Blob([buffer]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (item.type === 'text') {
    return (
      <div className={styles.card}>
        <div className={styles.meta}>
          <span className={styles.badge}>Text</span>
          <span className={styles.time}>{formatTime(item.createdAt)}</span>
        </div>
        <p className={styles.text}>{item.textContent}</p>
      </div>
    );
  }

  if (item.type === 'link') {
    return (
      <div className={styles.card}>
        <div className={styles.meta}>
          <span className={`${styles.badge} ${styles.linkBadge}`}>Link</span>
          <span className={styles.time}>{formatTime(item.createdAt)}</span>
        </div>
        <a
          href={item.textContent}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          {item.textContent}
        </a>
      </div>
    );
  }

  if (item.type === 'image' && !isPurged) {
    return (
      <div className={styles.card}>
        <div className={styles.meta}>
          <span className={`${styles.badge} ${styles.imageBadge}`}>Image</span>
          <span className={styles.time}>{formatTime(item.createdAt)}</span>
        </div>
        <img
          src={getFileUrl(roomId, item.id)}
          alt={item.fileName}
          className={styles.image}
          loading="lazy"
        />
        <div className={styles.fileInfo}>
          <span>{item.fileName}</span>
          <span className={styles.size}>{formatSize(item.fileSize)}</span>
        </div>
      </div>
    );
  }

  // File type (or purged image)
  return (
    <div className={styles.card}>
      <div className={styles.meta}>
        <span className={`${styles.badge} ${styles.fileBadge}`}>
          {item.type === 'image' ? 'Image' : 'File'}
        </span>
        {isPurged && <span className={styles.purgedBadge}>Server purged</span>}
        <span className={styles.time}>{formatTime(item.createdAt)}</span>
      </div>
      <div className={styles.fileCard}>
        <div className={styles.fileInfo}>
          <span className={styles.fileName}>{item.fileName}</span>
          <span className={styles.size}>{formatSize(item.fileSize)}</span>
        </div>
        <button
          className={styles.downloadBtn}
          onClick={handleDownload}
          disabled={downloading}
        >
          {p2pProgress !== null
            ? `${p2pProgress}%`
            : downloading
              ? 'Downloading...'
              : isPurged
                ? 'Get from Peers'
                : 'Download'}
        </button>
      </div>
    </div>
  );
}
