export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
export const PURGE_DAYS = 1;
export const CONTENT_PAGE_SIZE = 50;
export const WS_HEARTBEAT_INTERVAL = 30_000; // 30s
export const WS_HEARTBEAT_TIMEOUT = 10_000; // 10s
export const WS_RECONNECT_BASE_DELAY = 1_000;
export const WS_RECONNECT_MAX_DELAY = 30_000;
export const ROOM_ID_LENGTH = 10;
export const CONTENT_ID_LENGTH = 16;
export const PAIRING_CODE_LENGTH = 6;
// Excludes visually ambiguous characters (0, O, 1, I, L).
export const PAIRING_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const PAIRING_CODE_TTL_MS = 5 * 60 * 1000;
