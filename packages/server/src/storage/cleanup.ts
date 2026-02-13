import { purgeOldFiles } from '../db/repositories/content.js';
import { deleteFile, getUploadDirSizeBytes } from './disk.js';
import { config } from '../config.js';

export function runPurge(): number {
  const rows = purgeOldFiles(config.purgeDays);
  let deleted = 0;
  for (const row of rows) {
    if (row.file_path) {
      deleteFile(row.file_path);
      deleted++;
    }
  }
  console.log(`[cleanup] Purged ${deleted} files older than ${config.purgeDays} days`);
  return deleted;
}

export function checkDiskSafetyValve(): boolean {
  const maxBytes = config.maxUploadDirGb * 1024 * 1024 * 1024;
  const currentBytes = getUploadDirSizeBytes();
  if (currentBytes > maxBytes) {
    console.log(`[cleanup] Disk safety valve triggered: ${(currentBytes / 1e9).toFixed(2)} GB > ${config.maxUploadDirGb} GB`);
    runPurge();
    return true;
  }
  return false;
}

export function isDiskFull(): boolean {
  const maxBytes = config.maxUploadDirGb * 1024 * 1024 * 1024;
  const currentBytes = getUploadDirSizeBytes();
  return currentBytes >= maxBytes;
}
