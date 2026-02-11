import { getDb } from '../connection.js';
import { generateRoomId } from '../../utils/id.js';
import type { Room } from '@share-it/shared';

interface RoomRow {
  id: string;
  created_at: string;
  last_active: string;
}

function rowToRoom(row: RoomRow): Room {
  return {
    id: row.id,
    createdAt: row.created_at,
    lastActive: row.last_active,
  };
}

export function createRoom(): Room {
  const db = getDb();
  const id = generateRoomId();
  db.prepare('INSERT INTO rooms (id) VALUES (?)').run(id);
  const row = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id) as RoomRow;
  return rowToRoom(row);
}

export function getRoom(id: string): Room | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id) as RoomRow | undefined;
  return row ? rowToRoom(row) : null;
}

export function touchRoom(id: string): void {
  const db = getDb();
  db.prepare("UPDATE rooms SET last_active = datetime('now') WHERE id = ?").run(id);
}
