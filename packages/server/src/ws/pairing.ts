import type { WebSocket } from 'ws';
import { customAlphabet } from 'nanoid';
import {
  PAIRING_CODE_ALPHABET,
  PAIRING_CODE_LENGTH,
  PAIRING_CODE_TTL_MS,
  WsMessageType,
} from '@share-it/shared';

interface PairingEntry {
  ws: WebSocket;
  timeoutId: NodeJS.Timeout;
}

const pairings = new Map<string, PairingEntry>();
const generateCode = customAlphabet(PAIRING_CODE_ALPHABET, PAIRING_CODE_LENGTH);

export interface PairingHandle {
  code: string;
  expiresAt: string;
}

export function createPairing(ws: WebSocket): PairingHandle {
  let code = generateCode();
  // Extremely unlikely collision, but retry a few times to be safe.
  for (let i = 0; i < 5 && pairings.has(code); i++) {
    code = generateCode();
  }

  const expiresAt = new Date(Date.now() + PAIRING_CODE_TTL_MS).toISOString();

  const timeoutId = setTimeout(() => {
    const entry = pairings.get(code);
    if (!entry) return;
    pairings.delete(code);
    if (entry.ws.readyState === 1) {
      entry.ws.send(JSON.stringify({ type: WsMessageType.PairingExpired }));
      entry.ws.close();
    }
  }, PAIRING_CODE_TTL_MS);

  pairings.set(code, { ws, timeoutId });
  return { code, expiresAt };
}

export function removePairing(code: string): void {
  const entry = pairings.get(code);
  if (!entry) return;
  clearTimeout(entry.timeoutId);
  pairings.delete(code);
}

export function claimPairing(code: string, roomId: string): boolean {
  const entry = pairings.get(code);
  if (!entry) return false;
  clearTimeout(entry.timeoutId);
  pairings.delete(code);
  if (entry.ws.readyState === 1) {
    entry.ws.send(JSON.stringify({ type: WsMessageType.PairingClaimed, roomId }));
    entry.ws.close();
  }
  return true;
}
