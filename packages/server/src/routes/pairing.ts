import { Router } from 'express';
import { getRoom, touchRoom } from '../db/repositories/rooms.js';
import { claimPairing } from '../ws/pairing.js';
import { pairingClaimLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/api/pairing/claim', pairingClaimLimiter, (req, res) => {
  const { code, roomId } = req.body ?? {};

  if (typeof code !== 'string' || typeof roomId !== 'string') {
    res.status(400).json({ error: 'Missing code or roomId' });
    return;
  }

  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) {
    res.status(400).json({ error: 'Empty code' });
    return;
  }

  const room = getRoom(roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  const ok = claimPairing(normalizedCode, room.id);
  if (!ok) {
    res.status(404).json({ error: 'Invalid or expired code' });
    return;
  }

  touchRoom(room.id);
  res.status(204).end();
});

export default router;
