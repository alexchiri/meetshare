import {
  CHUNK_SIZE,
  BACKPRESSURE_HIGH,
  BACKPRESSURE_LOW,
  P2PMessageType,
} from '@share-it/shared';
import type { ManifestEntry, P2PControlMessage } from '@share-it/shared';
import type { WebRTCService } from './webrtc';
import {
  cacheContentBlob,
  cacheContentMeta,
  getCachedBlob,
  savePendingTransfer,
  getPendingTransfer,
  deletePendingTransfer,
} from './idb';

interface ActiveTransfer {
  contentId: string;
  peerId: string;
  chunks: ArrayBuffer[];
  receivedBytes: number;
  totalSize: number;
  resolve: (blob: ArrayBuffer) => void;
  reject: (err: Error) => void;
}

export class P2PTransferService {
  private webrtcService: WebRTCService;
  private activeTransfers = new Map<string, ActiveTransfer>();
  private peerManifests = new Map<string, ManifestEntry[]>();
  private localManifest: ManifestEntry[] = [];
  private onProgressCallbacks = new Map<string, (pct: number) => void>();

  constructor(webrtcService: WebRTCService) {
    this.webrtcService = webrtcService;
  }

  setLocalManifest(manifest: ManifestEntry[]): void {
    this.localManifest = manifest;
  }

  updatePeerManifest(peerId: string, manifest: ManifestEntry[]): void {
    this.peerManifests.set(peerId, manifest);
  }

  removePeer(peerId: string): void {
    this.peerManifests.delete(peerId);
    // Cancel active transfers from this peer
    for (const [contentId, transfer] of this.activeTransfers) {
      if (transfer.peerId === peerId) {
        // Save partial progress for resume
        savePendingTransfer(contentId, transfer.chunks, transfer.receivedBytes);
        this.activeTransfers.delete(contentId);
        transfer.reject(new Error('Peer disconnected'));
      }
    }
  }

  handleControlMessage(peerId: string, msg: P2PControlMessage): void {
    switch (msg.type) {
      case P2PMessageType.ManifestExchange:
        this.updatePeerManifest(peerId, msg.manifest);
        break;

      case P2PMessageType.TransferRequest:
        this.handleTransferRequest(peerId, msg.contentId, msg.fileHash);
        break;

      case P2PMessageType.TransferAccept:
        // Handled in requestFile promise
        break;

      case P2PMessageType.TransferReject:
        this.handleTransferReject(msg.contentId, msg.reason);
        break;

      case P2PMessageType.TransferComplete:
        this.handleTransferComplete(msg.contentId, msg.fileHash);
        break;

      case P2PMessageType.TransferCancel:
        this.activeTransfers.delete(msg.contentId);
        break;
    }
  }

  handleTransferData(peerId: string, data: ArrayBuffer): void {
    // Find active transfer for this peer
    for (const [, transfer] of this.activeTransfers) {
      if (transfer.peerId === peerId) {
        transfer.chunks.push(data);
        transfer.receivedBytes += data.byteLength;
        const pct = Math.round((transfer.receivedBytes / transfer.totalSize) * 100);
        this.onProgressCallbacks.get(transfer.contentId)?.(pct);
        break;
      }
    }
  }

  async requestFile(
    contentId: string,
    fileHash: string,
    onProgress?: (pct: number) => void,
  ): Promise<ArrayBuffer | null> {
    // Find a peer that has this file
    const peerId = this.findPeerWithFile(fileHash);
    if (!peerId) return null;

    if (onProgress) {
      this.onProgressCallbacks.set(contentId, onProgress);
    }

    const conn = this.webrtcService.getConnection(peerId);
    if (!conn?.controlChannel || conn.controlChannel.readyState !== 'open') return null;

    // Check for pending partial transfer
    const pending = await getPendingTransfer(contentId);

    return new Promise((resolve, reject) => {
      const transfer: ActiveTransfer = {
        contentId,
        peerId,
        chunks: pending?.chunks ?? [],
        receivedBytes: pending?.offset ?? 0,
        totalSize: 0,
        resolve,
        reject,
      };
      this.activeTransfers.set(contentId, transfer);

      conn.controlChannel!.send(JSON.stringify({
        type: P2PMessageType.TransferRequest,
        contentId,
        fileHash,
        offset: transfer.receivedBytes,
      }));

      // Timeout after 2 minutes
      setTimeout(() => {
        if (this.activeTransfers.has(contentId)) {
          this.activeTransfers.delete(contentId);
          reject(new Error('Transfer timeout'));
        }
      }, 120_000);
    });
  }

  private async handleTransferRequest(peerId: string, contentId: string, fileHash: string): Promise<void> {
    const blob = await getCachedBlob(contentId);
    const conn = this.webrtcService.getConnection(peerId);

    if (!blob || !conn?.controlChannel || !conn.transferChannel) {
      conn?.controlChannel?.send(JSON.stringify({
        type: P2PMessageType.TransferReject,
        contentId,
        reason: 'File not available',
      }));
      return;
    }

    // Accept
    conn.controlChannel.send(JSON.stringify({
      type: P2PMessageType.TransferAccept,
      contentId,
      totalSize: blob.byteLength,
    }));

    // Send chunks with backpressure
    const channel = conn.transferChannel;
    let offset = 0;

    const sendNextChunk = () => {
      while (offset < blob.byteLength) {
        if (channel.bufferedAmount > BACKPRESSURE_HIGH) {
          channel.onbufferedamountlow = () => {
            channel.onbufferedamountlow = null;
            sendNextChunk();
          };
          channel.bufferedAmountLowThreshold = BACKPRESSURE_LOW;
          return;
        }

        const end = Math.min(offset + CHUNK_SIZE, blob.byteLength);
        channel.send(blob.slice(offset, end));
        offset = end;
      }

      // Done
      conn.controlChannel!.send(JSON.stringify({
        type: P2PMessageType.TransferComplete,
        contentId,
        fileHash,
      }));
    };

    sendNextChunk();
  }

  private handleTransferReject(contentId: string, _reason: string): void {
    const transfer = this.activeTransfers.get(contentId);
    if (transfer) {
      this.activeTransfers.delete(contentId);
      this.onProgressCallbacks.delete(contentId);
      transfer.reject(new Error(`Transfer rejected: ${_reason}`));
    }
  }

  private async handleTransferComplete(contentId: string, _fileHash: string): Promise<void> {
    const transfer = this.activeTransfers.get(contentId);
    if (!transfer) return;

    // Combine chunks
    const totalSize = transfer.chunks.reduce((sum, c) => sum + c.byteLength, 0);
    const combined = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of transfer.chunks) {
      combined.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    // TODO: verify SHA-256 hash

    const blob = combined.buffer;
    await cacheContentBlob(contentId, blob);
    await deletePendingTransfer(contentId);

    this.activeTransfers.delete(contentId);
    this.onProgressCallbacks.delete(contentId);
    transfer.resolve(blob);
  }

  private findPeerWithFile(fileHash: string): string | null {
    // Fewest active transfers → already-connected → random tiebreak
    const candidates: { peerId: string; activeCount: number }[] = [];

    for (const [peerId, manifest] of this.peerManifests) {
      if (manifest.some(e => e.fileHash === fileHash)) {
        const conn = this.webrtcService.getConnection(peerId);
        if (conn?.controlChannel?.readyState === 'open') {
          const activeCount = Array.from(this.activeTransfers.values())
            .filter(t => t.peerId === peerId).length;
          candidates.push({ peerId, activeCount });
        }
      }
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => a.activeCount - b.activeCount);
    return candidates[0].peerId;
  }
}
