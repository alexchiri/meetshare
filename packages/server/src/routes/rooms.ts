import { Router } from 'express';
import QRCode from 'qrcode';
import { createRoom, getRoom, touchRoom } from '../db/repositories/rooms.js';
import { config } from '../config.js';
import { getPeerCount } from '../ws/rooms.js';

const router = Router();

router.post('/api/rooms', async (req, res) => {
  const room = createRoom();
  const url = `${config.baseUrl}/room/${room.id}`;
  const qrDataUrl = await QRCode.toDataURL(url, { width: 512, margin: 2 });

  res.status(201).json({
    id: room.id,
    url,
    qrDataUrl,
  });
});

router.get('/api/rooms/:roomId', (req, res) => {
  const room = getRoom(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  touchRoom(room.id);

  res.json({
    ...room,
    peerCount: getPeerCount(room.id),
  });
});

export default router;
