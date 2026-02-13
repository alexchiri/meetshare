import type { ContentItem } from '@share-it/shared';
import ContentCard from './ContentCard';
import styles from './ContentFeed.module.css';

interface Props {
  items: ContentItem[];
  roomId: string;
}

export default function ContentFeed({ items, roomId }: Props) {
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
        <ContentCard key={item.id} item={item} roomId={roomId} />
      ))}
    </div>
  );
}
