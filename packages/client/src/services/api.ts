import type {
  CreateRoomResponse,
  RoomResponse,
  ContentListResponse,
  ContentItem,
} from '@share-it/shared';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || res.statusText, body);
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function createRoom(): Promise<CreateRoomResponse> {
  return request<CreateRoomResponse>('/rooms', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getRoom(roomId: string): Promise<RoomResponse> {
  return request<RoomResponse>(`/rooms/${roomId}`);
}

export async function getContent(roomId: string, cursor?: string): Promise<ContentListResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  return request<ContentListResponse>(`/rooms/${roomId}/content?${params}`);
}

export async function postTextContent(
  roomId: string,
  type: 'text' | 'link',
  textContent: string,
): Promise<ContentItem> {
  return request<ContentItem>(`/rooms/${roomId}/content`, {
    method: 'POST',
    body: JSON.stringify({ type, textContent }),
  });
}

export async function uploadFile(
  roomId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<ContentItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}/rooms/${roomId}/content`);

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new ApiError(xhr.status, xhr.statusText));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}

export function getFileUrl(roomId: string, contentId: string): string {
  return `${BASE}/rooms/${roomId}/content/${contentId}/file`;
}
