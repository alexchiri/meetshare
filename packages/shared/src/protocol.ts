// WebSocket message types
export enum WsMessageType {
  // Server → Client
  Welcome = 'welcome',
  PeerJoin = 'peer:join',
  PeerLeave = 'peer:leave',
  ContentNew = 'content:new',
  SignalOffer = 'signal:offer',
  SignalAnswer = 'signal:answer',
  SignalIce = 'signal:ice',
  ManifestUpdate = 'manifest:update',
  Pong = 'pong',

  // Client → Server
  Ping = 'ping',
  ManifestAnnounce = 'manifest:announce',
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
  iceServers: RTCIceServer[];
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

export interface SignalOfferMessage extends WsMessageBase {
  type: WsMessageType.SignalOffer;
  from: string;
  to: string;
  offer: RTCSessionDescriptionInit;
}

export interface SignalAnswerMessage extends WsMessageBase {
  type: WsMessageType.SignalAnswer;
  from: string;
  to: string;
  answer: RTCSessionDescriptionInit;
}

export interface SignalIceMessage extends WsMessageBase {
  type: WsMessageType.SignalIce;
  from: string;
  to: string;
  candidate: RTCIceCandidateInit;
}

export interface ManifestUpdateMessage extends WsMessageBase {
  type: WsMessageType.ManifestUpdate;
  peerId: string;
  manifest: import('./types.js').ManifestEntry[];
}

export interface PongMessage extends WsMessageBase {
  type: WsMessageType.Pong;
}

// Client → Server messages
export interface PingMessage extends WsMessageBase {
  type: WsMessageType.Ping;
}

export interface ManifestAnnounceMessage extends WsMessageBase {
  type: WsMessageType.ManifestAnnounce;
  manifest: import('./types.js').ManifestEntry[];
}

// Signal messages from client include `to` for routing
export interface ClientSignalOffer extends WsMessageBase {
  type: WsMessageType.SignalOffer;
  to: string;
  offer: RTCSessionDescriptionInit;
}

export interface ClientSignalAnswer extends WsMessageBase {
  type: WsMessageType.SignalAnswer;
  to: string;
  answer: RTCSessionDescriptionInit;
}

export interface ClientSignalIce extends WsMessageBase {
  type: WsMessageType.SignalIce;
  to: string;
  candidate: RTCIceCandidateInit;
}

export type WsServerMessage =
  | WelcomeMessage
  | PeerJoinMessage
  | PeerLeaveMessage
  | ContentNewMessage
  | SignalOfferMessage
  | SignalAnswerMessage
  | SignalIceMessage
  | ManifestUpdateMessage
  | PongMessage;

export type WsClientMessage =
  | PingMessage
  | ManifestAnnounceMessage
  | ClientSignalOffer
  | ClientSignalAnswer
  | ClientSignalIce;

// P2P DataChannel message types
export enum P2PMessageType {
  ManifestExchange = 'manifest:exchange',
  TransferRequest = 'transfer:request',
  TransferAccept = 'transfer:accept',
  TransferReject = 'transfer:reject',
  TransferChunk = 'transfer:chunk',
  TransferComplete = 'transfer:complete',
  TransferCancel = 'transfer:cancel',
}

export interface P2PManifestExchange {
  type: P2PMessageType.ManifestExchange;
  manifest: import('./types.js').ManifestEntry[];
}

export interface P2PTransferRequest {
  type: P2PMessageType.TransferRequest;
  contentId: string;
  fileHash: string;
  offset?: number; // For resume
}

export interface P2PTransferAccept {
  type: P2PMessageType.TransferAccept;
  contentId: string;
  totalSize: number;
}

export interface P2PTransferReject {
  type: P2PMessageType.TransferReject;
  contentId: string;
  reason: string;
}

export interface P2PTransferComplete {
  type: P2PMessageType.TransferComplete;
  contentId: string;
  fileHash: string;
}

export interface P2PTransferCancel {
  type: P2PMessageType.TransferCancel;
  contentId: string;
}

export type P2PControlMessage =
  | P2PManifestExchange
  | P2PTransferRequest
  | P2PTransferAccept
  | P2PTransferReject
  | P2PTransferComplete
  | P2PTransferCancel;

// RTCIceServer type for environments without DOM types
export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer';
  sdp?: string;
}

export interface RTCIceCandidateInit {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}
