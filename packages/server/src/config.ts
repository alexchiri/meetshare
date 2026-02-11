import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(fileURLToPath(import.meta.url), '../../../../.env') });

// Also try local .env
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  baseUrl: process.env.BASE_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  dbPath: process.env.DB_PATH || './data/share-it.db',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10),
  purgeDays: parseInt(process.env.PURGE_DAYS || '7', 10),
  maxUploadDirGb: parseInt(process.env.MAX_UPLOAD_DIR_GB || '10', 10),
  turnServer: process.env.TURN_SERVER || '',
  turnUsername: process.env.TURN_USERNAME || '',
  turnCredential: process.env.TURN_CREDENTIAL || '',
};
