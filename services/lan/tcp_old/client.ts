import TcpSocket from "react-native-tcp-socket";
import { TcpClientOptions } from "./types";

export const connectAndSendChunks = ({
  host,
  port,
  chunks,
  onConnected,
  onProgress,
  onError,
  onClose,
}: TcpClientOptions) => {
  const client = TcpSocket.createConnection({ host, port }, () => {
    console.log(`[TCP Client] Connected to ${host}:${port}`);
    onConnected?.();

    chunks.forEach((chunk, i) => {
      client?.write(chunk);
      onProgress?.(i + 1, chunks.length);
    });

    setTimeout(() => {
      client?.end(); // Properly ends after buffer flush
      console.log("[TCP Client] Finished writing, closing connection...");
    }, 200);
  });

  client.on("error", (err: any) => {
    console.error("[TCP Client Error]", err);
    onError?.(err);
    client?.destroy();
  });

  client.on("close", () => {
    console.log("[TCP Client] Connection closed");
    onClose?.();
  });
  return client;
};
