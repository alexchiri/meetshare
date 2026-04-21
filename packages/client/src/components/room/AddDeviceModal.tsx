import { useEffect, useRef, useState } from 'react';
import { claimPairing, ApiError } from '../../services/api';
import { showToast } from '../common/Toaster';
import { PAIRING_CODE_LENGTH, PAIRING_CODE_ALPHABET } from '@share-it/shared';
import styles from './AddDeviceModal.module.css';

interface Props {
  roomId: string;
  onClose: () => void;
}

const ALPHABET_SET = new Set(PAIRING_CODE_ALPHABET.split(''));

function sanitize(input: string): string {
  return input
    .toUpperCase()
    .split('')
    .filter((c) => ALPHABET_SET.has(c))
    .join('')
    .slice(0, PAIRING_CODE_LENGTH);
}

export default function AddDeviceModal({ roomId, onClose }: Props) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(next: string) {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await claimPairing(next, roomId);
      showToast('Device added', 'success');
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Invalid or expired code');
      } else {
        setError('Something went wrong. Try again.');
      }
      setSubmitting(false);
    }
  }

  function onChange(raw: string) {
    const next = sanitize(raw);
    setCode(next);
    setError(null);
    if (next.length === PAIRING_CODE_LENGTH) {
      submit(next);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length === PAIRING_CODE_LENGTH) submit(code);
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Add a device</h2>
        <p className={styles.body}>
          On the device you want to add, open{' '}
          <span className={styles.path}>/join</span> and enter its code here.
        </p>
        <form onSubmit={onSubmit}>
          <input
            ref={inputRef}
            className={styles.input}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            placeholder="ABC123"
            maxLength={PAIRING_CODE_LENGTH}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            disabled={submitting}
            aria-label="Pairing code"
          />
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancel}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submit}
              disabled={submitting || code.length !== PAIRING_CODE_LENGTH}
            >
              {submitting ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
