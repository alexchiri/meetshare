import type { ContentItem } from '@share-it/shared';
import type { P2PTransferService } from '../../services/p2p-transfer';
import ContentCard from './ContentCard';
import styles from './ContentFeed.module.css';

interface Props {
  items: ContentItem[];
  roomId: string;
  p2pRef: React.RefObject<P2PTransferService | null>;
}

export default function ContentFeed({ items, roomId, p2pRef }: Props) {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Nothing shared yet.</p>
        <p className={styles.hint}>Share a link, text, or file to get started!</p>
      </div>
    );
  }

  return (
    <div className={styles.feed}>
      {items.map((item) => (
        <ContentCard key={item.id} item={item} roomId={roomId} p2pRef={p2pRef} />
      ))}
    </div>
  );
}
