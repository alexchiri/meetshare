import { Router } from 'express';
import path from 'path';
import {
  createTextContent,
  createFileContent,
  getContentForRoom,
  getContentById,
  getContentFilePath,
} from '../db/repositories/content.js';
import { getRoom, touchRoom } from '../db/repositories/rooms.js';
import { computeFileHash } from '../storage/disk.js';
import { checkDiskSafetyValve } from '../storage/cleanup.js';
import { isImage } from '../utils/mime.js';
import { upload } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import { broadcastToRoom } from '../ws/rooms.js';
import { WsMessageType } from '@share-it/shared';

const router = Router();

// Get content list
router.get('/api/rooms/:roomId/content', (req, res) => {
  const room = getRoom(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  const cursor = req.query.cursor as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const items = getContentForRoom(room.id, cursor, limit);

  res.json({
    items,
    nextCursor: items.length === limit ? items[items.length - 1].createdAt : undefined,
  });
});

// Create text/link content
router.post('/api/rooms/:roomId/content', uploadLimiter, (req, res, next) => {
  // Check if it's a multipart upload
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    // Handle file upload
    upload.single('file')(req, res, (err) => {
      if (err) {
        next(err);
        return;
      }
      handleFileUpload(req, res);
    });
  } else {
    handleTextContent(req, res);
  }
});

function handleTextContent(req: import('express').Request, res: import('express').Response) {
  const room = getRoom(req.params.roomId as string);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  const { type, textContent } = req.body;
  if (!type || !textContent || !['text', 'link'].includes(type)) {
    res.status(400).json({ error: 'Invalid text content' });
    return;
  }

  const item = createTextContent({
    roomId: room.id,
    type,
    textContent,
  });

  touchRoom(room.id);

  broadcastToRoom(room.id, {
    type: WsMessageType.ContentNew,
    item,
  });

  res.status(201).json(item);
}

function handleFileUpload(req: import('express').Request, res: import('express').Response) {
  const room = getRoom(req.params.roomId as string);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file provided' });
    return;
  }

  // Check disk safety valve
  checkDiskSafetyValve();

  const fileHash = computeFileHash(file.path);
  const type = isImage(file.mimetype) ? 'image' : 'file';

  const item = createFileContent({
    roomId: room.id,
    type,
    fileName: file.originalname,
    filePath: file.path,
    fileSize: file.size,
    mimeType: file.mimetype,
    fileHash,
  });

  touchRoom(room.id);

  broadcastToRoom(room.id, {
    type: WsMessageType.ContentNew,
    item,
  });

  res.status(201).json(item);
}

// Download file
router.get('/api/rooms/:roomId/content/:id/file', (req, res) => {
  const item = getContentById(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Content not found' });
    return;
  }

  if (item.roomId !== req.params.roomId) {
    res.status(404).json({ error: 'Content not found in this room' });
    return;
  }

  const fileInfo = getContentFilePath(req.params.id);
  if (!fileInfo?.filePath || fileInfo.purgedAt) {
    res.status(410).json({
      error: 'File has been purged from server',
      fileHash: item.fileHash,
      fileName: item.fileName,
    });
    return;
  }

  res.download(fileInfo.filePath, item.fileName || path.basename(fileInfo.filePath));
});

export default router;
