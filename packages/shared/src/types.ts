export interface Room {
  id: string;
  createdAt: string;
  lastActive: string;
}

export type ContentType = 'text' | 'link' | 'file' | 'image';

export interface ContentItem {
  id: string;
  roomId: string;
  type: ContentType;
  textContent?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  fileHash?: string;
  createdAt: string;
  purgedAt?: string | null;
}

export interface PeerInfo {
  peerId: string;
  joinedAt: string;
}

// REST API types
export interface CreateRoomResponse {
  id: string;
  url: string;
  qrDataUrl: string;
}

export interface RoomResponse extends Room {
  peerCount: number;
}

export interface ContentListResponse {
  items: ContentItem[];
  nextCursor?: string;
}

export interface CreateTextContentRequest {
  type: 'text' | 'link';
  textContent: string;
}
