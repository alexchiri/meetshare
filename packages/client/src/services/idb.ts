import { openDB, type IDBPDatabase } from 'idb';
import { STORAGE_BUDGET } from '@share-it/shared';
import type { ContentItem } from '@share-it/shared';

const DB_NAME = 'share-it';
const DB_VERSION = 1;

interface ContentMetaRecord {
  contentId: string;
  roomId: string;
  meta: ContentItem;
  cachedAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Content metadata
        const metaStore = db.createObjectStore('contentMeta', { keyPath: 'contentId' });
        metaStore.createIndex('byRoom', 'roomId');
        metaStore.createIndex('byCachedAt', 'cachedAt');

        // Content blobs
        db.createObjectStore('contentBlobs', { keyPath: 'contentId' });

        // Pending transfers
        db.createObjectStore('pendingTransfers', { keyPath: 'contentId' });
      },
    });
  }
  return dbPromise;
}

export async function cacheContentMeta(item: ContentItem): Promise<void> {
  const db = await getDB();
  await db.put('contentMeta', {
    contentId: item.id,
    roomId: item.roomId,
    meta: item,
    cachedAt: Date.now(),
  } as ContentMetaRecord);
}

export async function cacheContentBlob(contentId: string, blob: ArrayBuffer): Promise<void> {
  const db = await getDB();
  await db.put('contentBlobs', { contentId, data: blob });
}

export async function getCachedMeta(contentId: string): Promise<ContentItem | null> {
  const db = await getDB();
  const record = await db.get('contentMeta', contentId) as ContentMetaRecord | undefined;
  return record?.meta ?? null;
}

export async function getCachedBlob(contentId: string): Promise<ArrayBuffer | null> {
  const db = await getDB();
  const record = await db.get('contentBlobs', contentId) as { contentId: string; data: ArrayBuffer } | undefined;
  return record?.data ?? null;
}

export async function getRoomCachedContent(roomId: string): Promise<ContentItem[]> {
  const db = await getDB();
  const records = await db.getAllFromIndex('contentMeta', 'byRoom', roomId) as ContentMetaRecord[];
  return records.map(r => r.meta);
}

export async function getLocalManifest(roomId: string) {
  const db = await getDB();
  const metas = await db.getAllFromIndex('contentMeta', 'byRoom', roomId) as ContentMetaRecord[];
  const entries = [];
  for (const meta of metas) {
    const blob = await db.get('contentBlobs', meta.contentId);
    if (blob && meta.meta.fileHash) {
      entries.push({
        contentId: meta.contentId,
        fileHash: meta.meta.fileHash,
        fileSize: meta.meta.fileSize!,
        fileName: meta.meta.fileName!,
        mimeType: meta.meta.mimeType!,
      });
    }
  }
  return entries;
}

export async function savePendingTransfer(
  contentId: string,
  chunks: ArrayBuffer[],
  offset: number,
): Promise<void> {
  const db = await getDB();
  await db.put('pendingTransfers', { contentId, chunks, offset });
}

export async function getPendingTransfer(
  contentId: string,
): Promise<{ chunks: ArrayBuffer[]; offset: number } | null> {
  const db = await getDB();
  const record = await db.get('pendingTransfers', contentId);
  return record ?? null;
}

export async function deletePendingTransfer(contentId: string): Promise<void> {
  const db = await getDB();
  await db.delete('pendingTransfers', contentId);
}

export async function evictLRU(): Promise<void> {
  const db = await getDB();
  // Estimate total storage
  const allMetas = await db.getAllFromIndex('contentMeta', 'byCachedAt') as ContentMetaRecord[];
  let totalSize = 0;
  const sizes: { contentId: string; size: number; cachedAt: number }[] = [];

  for (const meta of allMetas) {
    const blob = await db.get('contentBlobs', meta.contentId);
    const size = blob?.data?.byteLength ?? 0;
    totalSize += size;
    sizes.push({ contentId: meta.contentId, size, cachedAt: meta.cachedAt });
  }

  if (totalSize <= STORAGE_BUDGET) return;

  // Sort by oldest first
  sizes.sort((a, b) => a.cachedAt - b.cachedAt);

  for (const entry of sizes) {
    if (totalSize <= STORAGE_BUDGET * 0.8) break;
    await db.delete('contentMeta', entry.contentId);
    await db.delete('contentBlobs', entry.contentId);
    totalSize -= entry.size;
  }
}
