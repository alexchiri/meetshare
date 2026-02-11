import { QRCodeSVG } from 'qrcode.react';
import styles from './QRCodeModal.module.css';

interface Props {
  url: string;
  onClose: () => void;
}

export default function QRPanel({ url, onClose }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.qrSide}>
        <div className={styles.qr}>
          <QRCodeSVG
            value={url}
            size={200}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
            includeMargin
          />
        </div>
      </div>
      <div className={styles.info}>
        <p className={styles.label}>Scan to join</p>
        <p className={styles.url}>{url}</p>
        <button className={styles.hide} onClick={onClose}>
          Hide QR code
        </button>
      </div>
    </div>
  );
}
