import multer from 'multer';
import path from 'path';
import { config } from '../config.js';
import { getRoomUploadDir } from '../storage/disk.js';

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const roomId = req.params.roomId as string;
    const dir = getRoomUploadDir(roomId);
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024,
  },
});
