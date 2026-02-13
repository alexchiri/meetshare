import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useRoom } from '../../hooks/useRoom';
import { useWebSocket } from '../../hooks/useWebSocket';
import RoomHeader from './RoomHeader';
import QRPanel from './QRCodeModal';
import ShareInput from './ShareInput';
import ContentFeed from './ContentFeed';
import styles from './RoomPage.module.css';

export default function RoomPage() {
  const { roomId = '' } = useParams<{ roomId: string }>();
  const { room, content, loading, error } = useRoom(roomId);
  useWebSocket(roomId);
  const location = useLocation();
  const [showQR, setShowQR] = useState(!!(location.state as any)?.created);

  if (!roomId) return <div>Invalid room</div>;

  if (loading) {
    return <div className={styles.loading}>Loading room...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!room) {
    return <div className={styles.error}>Room not found</div>;
  }

  const roomUrl = `${window.location.origin}/room/${room.id}`;

  return (
    <div className={styles.container}>
      <RoomHeader room={room} showQR={showQR} onToggleQR={() => setShowQR(!showQR)} />
      {showQR && <QRPanel url={roomUrl} onClose={() => setShowQR(false)} />}
      <ShareInput roomId={roomId} />
      <ContentFeed items={content} roomId={roomId} />
    </div>
  );
}
