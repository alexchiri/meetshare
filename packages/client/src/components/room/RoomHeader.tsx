import type { RoomResponse } from '@share-it/shared';
import { usePeerStore } from '../../stores/peerStore';
import { showToast } from '../common/Toaster';
import styles from './RoomHeader.module.css';

interface Props {
  room: RoomResponse;
  showQR: boolean;
  onToggleQR: () => void;
}

export default function RoomHeader({ room, showQR, onToggleQR }: Props) {
  const peers = usePeerStore((s) => s.peers);
  const roomUrl = `${window.location.origin}/room/${room.id}`;

  function copyLink() {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(roomUrl).then(
        () => showToast('Link copied!', 'success'),
        () => fallbackCopy(),
      );
    } else {
      fallbackCopy();
    }
  }

  function fallbackCopy() {
    const textarea = document.createElement('textarea');
    textarea.value = roomUrl;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Link copied!', 'success');
  }

  return (
    <div className={styles.header}>
      <div className={styles.info}>
        <h1 className={styles.name}>Room {room.id}</h1>
        <span className={styles.peers}>
          {peers.size + 1} {peers.size === 0 ? 'person' : 'people'} in room
        </span>
      </div>
      <div className={styles.actions}>
        <button className={styles.btn} onClick={copyLink} title="Copy link">
          Copy Link
        </button>
        <button
          className={showQR ? styles.btn : styles.btnPrimary}
          onClick={onToggleQR}
          title={showQR ? 'Hide QR code' : 'Show QR code'}
        >
          {showQR ? 'Hide QR' : 'QR Code'}
        </button>
      </div>
    </div>
  );
}
