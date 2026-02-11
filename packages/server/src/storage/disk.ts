import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config.js';

export function ensureUploadDir(): void {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

export function getRoomUploadDir(roomId: string): string {
  const dir = path.join(config.uploadDir, roomId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function computeFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore deletion errors
  }
}

export function getUploadDirSizeBytes(): number {
  if (!fs.existsSync(config.uploadDir)) return 0;
  let total = 0;
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        total += fs.statSync(full).size;
      }
    }
  }
  walk(config.uploadDir);
  return total;
}
