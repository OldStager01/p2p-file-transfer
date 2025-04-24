import { FileReassembler } from "@/utils/chunkHandling/fileReassembler";
import TcpSocket from "react-native-tcp-socket";

let server: TcpSocket.Server | null = null;
let fileReassembler: FileReassembler | null = null;

export const startTcpServer = ({
  port = 12345,
  host = "0.0.0.0",
  onConnection,
  onChunkReceived,
  onFileComplete,
  onTransferProgress,
  onError,
  onClose,
}: {
  port?: number;
  host?: string;
  onConnection?: (info: { remoteAddress: string }) => void;
  onChunkReceived?: (
    chunk: { sessionId: string; index: number; data: string },
    info: { remoteAddress: string }
  ) => void;
  onFileComplete?: (fileUri: string, fileName: string) => void;
  onTransferProgress?: (
    sessionId: string,
    receivedChunks: number,
    totalChunks?: number
  ) => void;
  onError?: (err: any) => void;
  onClose?: () => void;
}) => {
  // Initialize file reassembler
  fileReassembler = new FileReassembler((sessionId, received, total) => {
    onTransferProgress?.(sessionId, received, total);
  });

  server = TcpSocket.createServer((socket) => {
    const clientIp = socket.remoteAddress ?? "unknown";
    socket.setEncoding?.("utf8");

    console.log("[TCP Server] Client connected:", clientIp);
    onConnection?.({ remoteAddress: clientIp });

    let buffer = "";

    socket.on("data", (data) => {
      console.log("[TCP Server] Received data chunk:", data.length, "bytes");

      try {
        buffer += data.toString();

        // Process complete messages (terminated by newline)
        let boundaryIndex;
        while ((boundaryIndex = buffer.indexOf("\n")) >= 0) {
          const raw = buffer.slice(0, boundaryIndex).trim();
          buffer = buffer.slice(boundaryIndex + 1);

          if (!raw) continue;

          try {
            const parsed = JSON.parse(raw);
            console.log(
              `[TCP Server] Processed chunk ${parsed.index}:`,
              parsed.data
                ? `${parsed.data.slice(0, 20)}... (${parsed.data.length} bytes)`
                : "No data"
            );

            // Notify about the received chunk
            onChunkReceived?.(parsed, { remoteAddress: clientIp });

            // Process chunk through the reassembler
            if (fileReassembler) {
              // Register completion callback for this session if not already registered
              if (onFileComplete && parsed.sessionId) {
                fileReassembler.onFileComplete(
                  parsed.sessionId,
                  onFileComplete
                );
              }

              // Process the chunk
              fileReassembler.processChunk(parsed);
            }

            // Send acknowledgment back to the sender
            // Send acknowledgment back to the sender
            const ack = JSON.stringify({
              type: "ack",
              sessionId: parsed.sessionId,
              index: parsed.index,
            });

            // Use the polyfilled Buffer
            if (typeof Buffer !== "undefined") {
              socket.write(Buffer.from(ack + "\n"));
            } else {
              // Fallback if Buffer is still not available
              socket.write(ack + "\n");
            }
            console.log(`[TCP Server] Sent ACK for chunk ${parsed.index}`);
          } catch (err) {
            console.error("[TCP Server] Failed to parse JSON:", err);
          }
        }
      } catch (err) {
        console.error("[TCP Server] Error processing data:", err);
      }
    });

    socket.on("error", (err) => {
      console.error("[TCP Server] Socket error:", err);
      onError?.(err);
    });

    socket.on("close", (hadError) => {
      console.log(
        `[TCP Server] Connection closed ${
          hadError ? "with error" : "without error"
        }`
      );
      onClose?.();
    });
  });

  server.on("error", (err) => {
    console.error("[TCP Server] Server error:", err);
    onError?.(err);
  });

  server.listen({ port, host }, () => {
    console.log(`[TCP Server] Listening on ${host}:${port}`);
  });

  return {
    stop: () => {
      server?.close();
      server = null;
      fileReassembler = null;
      console.log("[TCP Server] Stopped.");
    },
    getActiveTransfers: () => {
      return fileReassembler?.getActiveSessions() || {};
    },
  };
};

export const stopTcpServer = () => {
  if (server) {
    try {
      server.close();
      console.log("[TCP Server] Stopped.");
    } catch (err) {
      console.error("[TCP Server] Stop error:", err);
    }
    server = null;
    fileReassembler = null;
  }
};
