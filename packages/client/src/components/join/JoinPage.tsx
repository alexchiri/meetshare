import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { WsMessageType } from '@share-it/shared';
import type { WsServerMessage } from '@share-it/shared';
import styles from './JoinPage.module.css';

type Status = 'connecting' | 'ready' | 'claimed' | 'expired' | 'error';

export default function JoinPage() {
  const [status, setStatus] = useState<Status>('connecting');
  const [code, setCode] = useState<string>('');
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws?mode=pair`;
    const ws = new WebSocket(url);
    let gotReady = false;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsServerMessage;
        switch (msg.type) {
          case WsMessageType.PairingReady:
            gotReady = true;
            setCode(msg.code);
            setStatus('ready');
            break;
          case WsMessageType.PairingClaimed:
            setStatus('claimed');
            navigate(`/room/${msg.roomId}`);
            break;
          case WsMessageType.PairingExpired:
            setStatus('expired');
            break;
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      setStatus((current) => {
        if (current === 'claimed' || current === 'expired') return current;
        return gotReady ? 'expired' : 'error';
      });
    };

    ws.onerror = () => {
      if (!gotReady) setStatus('error');
    };

    return () => {
      ws.close();
    };
  }, [attempt, navigate]);

  function retry() {
    setCode('');
    setStatus('connecting');
    setAttempt((n) => n + 1);
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Add this device to a room</h1>
      <p className={styles.subtitle}>
        Open a room on your other device, tap <strong>Add Device</strong>, and
        enter the code below.
      </p>

      {status === 'connecting' && (
        <div className={styles.panel}>
          <p className={styles.loading}>Generating code…</p>
        </div>
      )}

      {status === 'ready' && (
        <div className={styles.panel}>
          <div className={styles.qrWrap}>
            <QRCodeSVG
              value={code}
              size={180}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              includeMargin
            />
          </div>
          <div className={styles.codeBlock}>
            <span className={styles.codeLabel}>Your code</span>
            <span className={styles.code}>{code}</span>
            <span className={styles.ttlNote}>Expires in 5 minutes</span>
          </div>
        </div>
      )}

      {status === 'expired' && (
        <div className={styles.panel}>
          <p className={styles.stateHeading}>Code expired</p>
          <p className={styles.stateBody}>Get a fresh code to try again.</p>
          <button className={styles.retry} onClick={retry}>
            Get new code
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.panel}>
          <p className={styles.stateHeading}>Could not reach the server</p>
          <p className={styles.stateBody}>Check your connection and retry.</p>
          <button className={styles.retry} onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {status === 'claimed' && (
        <div className={styles.panel}>
          <p className={styles.loading}>Joining room…</p>
        </div>
      )}
    </div>
  );
}
