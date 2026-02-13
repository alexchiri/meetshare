// WebSocket message types
export enum WsMessageType {
  // Server → Client
  Welcome = 'welcome',
  PeerJoin = 'peer:join',
  PeerLeave = 'peer:leave',
  ContentNew = 'content:new',
  Pong = 'pong',

  // Client → Server
  Ping = 'ping',
}

// Base WS message
export interface WsMessageBase {
  type: WsMessageType;
}

// Server → Client messages
export interface WelcomeMessage extends WsMessageBase {
  type: WsMessageType.Welcome;
  peerId: string;
  peers: { peerId: string; joinedAt: string }[];
}

export interface PeerJoinMessage extends WsMessageBase {
  type: WsMessageType.PeerJoin;
  peerId: string;
  joinedAt: string;
}

export interface PeerLeaveMessage extends WsMessageBase {
  type: WsMessageType.PeerLeave;
  peerId: string;
}

export interface ContentNewMessage extends WsMessageBase {
  type: WsMessageType.ContentNew;
  item: import('./types.js').ContentItem;
}

export interface PongMessage extends WsMessageBase {
  type: WsMessageType.Pong;
}

// Client → Server messages
export interface PingMessage extends WsMessageBase {
  type: WsMessageType.Ping;
}

export type WsServerMessage =
  | WelcomeMessage
  | PeerJoinMessage
  | PeerLeaveMessage
  | ContentNewMessage
  | PongMessage;

export type WsClientMessage = PingMessage;
