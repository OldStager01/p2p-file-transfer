export interface ChunkReceivedInfo {
  remoteAddress: string;
}

export interface TcpServerOptions {
  port?: number;
  host?: string;
  onChunkReceived: (chunk: Buffer, info: ChunkReceivedInfo) => void;
  onConnection?: (info: ChunkReceivedInfo) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export interface TcpClientOptions {
  host: string;
  port: number;
  chunks: Buffer[];
  onProgress?: (sentChunks: number, totalChunks: number) => void;
  onConnected?: () => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}
