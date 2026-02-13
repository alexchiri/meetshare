import { useState, type ReactNode } from 'react';
import type { ContentItem } from '@share-it/shared';
import { getFileUrl } from '../../services/api';
import { showToast } from '../common/Toaster';
import styles from './ContentCard.module.css';

const URL_RE = /(https?:\/\/[^\s<]+)/g;

function linkify(text: string): ReactNode[] {
  const parts = text.split(URL_RE);
  return parts.map((part, i) =>
    URL_RE.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={styles.link}>
        {part}
      </a>
    ) : (
      part
    ),
  );
}

interface Props {
  item: ContentItem;
  roomId: string;
}

export default function ContentCard({ item, roomId }: Props) {
  const [downloading, setDownloading] = useState(false);
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
      if (!isPurged) {
        window.open(getFileUrl(roomId, item.id), '_blank');
      } else {
        showToast('File no longer available', 'error');
      }
    } catch {
      showToast('Download failed', 'error');
    } finally {
      setDownloading(false);
    }
  }

  if (item.type === 'text') {
    return (
      <div className={styles.card}>
        <div className={styles.meta}>
          <span className={styles.badge}>Text</span>
          <span className={styles.time}>{formatTime(item.createdAt)}</span>
        </div>
        <p className={styles.text}>{linkify(item.textContent || '')}</p>
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
        {isPurged && <span className={styles.purgedBadge}>Expired</span>}
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
          disabled={downloading || isPurged}
        >
          {downloading
            ? 'Downloading...'
            : isPurged
              ? 'Unavailable'
              : 'Download'}
        </button>
      </div>
    </div>
  );
}
