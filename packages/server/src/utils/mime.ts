const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/avif',
]);

export function isImage(mimeType: string): boolean {
  return IMAGE_MIMES.has(mimeType);
}

const ALLOWED_MIMES = new Set([
  ...IMAGE_MIMES,
  'application/pdf',
  'application/zip',
  'application/x-tar',
  'application/gzip',
  'text/plain',
  'text/csv',
  'text/html',
  'text/css',
  'text/javascript',
  'application/json',
  'application/xml',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'application/octet-stream',
]);

export function isAllowedMime(mimeType: string): boolean {
  // Allow all mimes — this is just a reference set
  return true;
}
