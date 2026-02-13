import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../../services/api';
import { showToast } from '../common/Toaster';
import Logo from '../common/Logo';
import styles from './HomePage.module.css';

export default function HomePage() {
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  async function handleCreate() {
    if (creating) return;

    setCreating(true);
    try {
      const room = await createRoom();
      navigate(`/room/${room.id}`);
    } catch (err) {
      showToast('Failed to create room', 'error');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.logoWrap}>
          <Logo size={72} />
        </div>
        <h1 className={styles.title}>MeetShare<span className={styles.titleApp}>.app</span></h1>
        <p className={styles.subtitle}>
          Instantly share links, text, and files with everyone in the room. No sign-up required.
        </p>
      </div>

      <button className={styles.button} onClick={handleCreate} disabled={creating}>
        <span className={styles.buttonIcon}>+</span>
        {creating ? 'Creating...' : 'Create a Room'}
      </button>

      <div className={styles.features}>
        <div className={styles.feature}>
          <div className={`${styles.featureIcon} ${styles.iconQr}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="8" height="8" rx="1" />
              <rect x="14" y="2" width="8" height="8" rx="1" />
              <rect x="2" y="14" width="8" height="8" rx="1" />
              <rect x="14" y="14" width="4" height="4" />
              <line x1="22" y1="14" x2="22" y2="14.01" />
              <line x1="22" y1="22" x2="22" y2="22.01" />
              <line x1="18" y1="18" x2="18" y2="18.01" />
            </svg>
          </div>
          <h3>QR Code Sharing</h3>
          <p>Show a QR code on the projector — anyone can scan and join instantly.</p>
        </div>
        <div className={styles.feature}>
          <div className={`${styles.featureIcon} ${styles.iconP2p}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3>Auto-cleanup</h3>
          <p>Files auto-delete after 24 hours for privacy. No lingering data.</p>
        </div>
        <div className={styles.feature}>
          <div className={`${styles.featureIcon} ${styles.iconZap}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h3>Zero Friction</h3>
          <p>No accounts, no installs. Just create a room and share the link.</p>
        </div>
      </div>
    </div>
  );
}
