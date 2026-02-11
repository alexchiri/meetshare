import { getDb } from '../connection.js';
import { generateContentId } from '../../utils/id.js';
import type { ContentItem, ContentType } from '@share-it/shared';

interface ContentRow {
  id: string;
  room_id: string;
  type: string;
  text_content: string | null;
  file_name: string | null;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  file_hash: string | null;
  created_at: string;
  purged_at: string | null;
}

function rowToContentItem(row: ContentRow): ContentItem {
  return {
    id: row.id,
    roomId: row.room_id,
    type: row.type as ContentType,
    textContent: row.text_content ?? undefined,
    fileName: row.file_name ?? undefined,
    fileSize: row.file_size ?? undefined,
    mimeType: row.mime_type ?? undefined,
    fileHash: row.file_hash ?? undefined,
    createdAt: row.created_at,
    purgedAt: row.purged_at,
  };
}

export interface CreateTextContent {
  roomId: string;
  type: 'text' | 'link';
  textContent: string;
}

export interface CreateFileContent {
  roomId: string;
  type: 'file' | 'image';
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileHash: string;
}

export function createTextContent(data: CreateTextContent): ContentItem {
  const db = getDb();
  const id = generateContentId();
  db.prepare(
    'INSERT INTO content_items (id, room_id, type, text_content) VALUES (?, ?, ?, ?)'
  ).run(id, data.roomId, data.type, data.textContent);
  const row = db.prepare('SELECT * FROM content_items WHERE id = ?').get(id) as ContentRow;
  return rowToContentItem(row);
}

export function createFileContent(data: CreateFileContent): ContentItem {
  const db = getDb();
  const id = generateContentId();
  db.prepare(
    'INSERT INTO content_items (id, room_id, type, file_name, file_path, file_size, mime_type, file_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, data.roomId, data.type, data.fileName, data.filePath, data.fileSize, data.mimeType, data.fileHash);
  const row = db.prepare('SELECT * FROM content_items WHERE id = ?').get(id) as ContentRow;
  return rowToContentItem(row);
}

export function getContentForRoom(roomId: string, cursor?: string, limit = 50): ContentItem[] {
  const db = getDb();
  let rows: ContentRow[];
  if (cursor) {
    rows = db.prepare(
      'SELECT * FROM content_items WHERE room_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT ?'
    ).all(roomId, cursor, limit) as ContentRow[];
  } else {
    rows = db.prepare(
      'SELECT * FROM content_items WHERE room_id = ? ORDER BY created_at DESC LIMIT ?'
    ).all(roomId, limit) as ContentRow[];
  }
  return rows.map(rowToContentItem);
}

export function getContentById(id: string): ContentItem | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM content_items WHERE id = ?').get(id) as ContentRow | undefined;
  return row ? rowToContentItem(row) : null;
}

export function getContentFilePath(id: string): { filePath: string | null; purgedAt: string | null } | null {
  const db = getDb();
  const row = db.prepare('SELECT file_path, purged_at FROM content_items WHERE id = ?').get(id) as { file_path: string | null; purged_at: string | null } | undefined;
  return row ? { filePath: row.file_path, purgedAt: row.purged_at } : null;
}

export function purgeOldFiles(days: number): ContentRow[] {
  const db = getDb();
  const rows = db.prepare(
    `SELECT * FROM content_items
     WHERE type IN ('file', 'image')
     AND file_path IS NOT NULL
     AND purged_at IS NULL
     AND created_at < datetime('now', ? || ' days')`
  ).all(`-${days}`) as ContentRow[];

  if (rows.length > 0) {
    db.prepare(
      `UPDATE content_items
       SET file_path = NULL, purged_at = datetime('now')
       WHERE type IN ('file', 'image')
       AND file_path IS NOT NULL
       AND purged_at IS NULL
       AND created_at < datetime('now', ? || ' days')`
    ).run(`-${days}`);
  }

  return rows;
}
