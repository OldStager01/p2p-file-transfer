import TcpSocket from "react-native-tcp-socket";
import { TcpServerOptions } from "./types";
import { Buffer } from "buffer";

export const startTcpServer = ({
  port = 12345,
  host = "0.0.0.0",
  onConnection,
  onChunkReceived,
  onError,
  onClose,
}: TcpServerOptions) => {
  const server = TcpSocket.createServer((socket) => {
    const clientIp = socket.remoteAddress ?? "unknown";

    onConnection?.({ remoteAddress: clientIp });

    let receivedChunks: Buffer[] = [];

    socket.on("data", (data) => {
      const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
      console.log("[TCP Server Received Chunk]", chunk.toString());
      onChunkReceived(chunk, { remoteAddress: clientIp });
      receivedChunks.push(chunk); // Accumulate chunks
    });

    socket.on("connect", () => {
      console.log("[TCP Server] Client connected:", clientIp);
    });

    socket.on("error", (err) => {
      console.error("[TCP Server Error]", err);
      onError?.(err);
    });

    socket.on("close", () => {
      console.log("[TCP Server] Connection closed. Processing data...");
    });
  });

  server.listen({ port, host }, () => {
    console.log(`[TCP Server Started] Listening on ${host}:${port}`);
  });
};
