import { nanoid } from 'nanoid';
import { ROOM_ID_LENGTH, CONTENT_ID_LENGTH } from '@share-it/shared';

export function generateRoomId(): string {
  return nanoid(ROOM_ID_LENGTH);
}

export function generateContentId(): string {
  return nanoid(CONTENT_ID_LENGTH);
}
