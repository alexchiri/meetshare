import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config.js';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dbDir = path.dirname(config.dbPath);
    fs.mkdirSync(dbDir, { recursive: true });
    db = new Database(config.dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runMigrations(db);
  }
  return db;
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_active TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS content_items (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('text', 'link', 'file', 'image')),
      text_content TEXT,
      file_name TEXT,
      file_path TEXT,
      file_size INTEGER,
      mime_type TEXT,
      file_hash TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      purged_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_content_room ON content_items(room_id);
    CREATE INDEX IF NOT EXISTS idx_content_created ON content_items(created_at);
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}
