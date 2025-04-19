import TcpSocket from "react-native-tcp-socket";
import { TcpClientOptions } from "./types";

export const connectAndSendChunks = ({
  host,
  port,
  chunks,
  onProgress,
  onConnected,
  onError,
  onClose,
}: TcpClientOptions) => {
  const client = TcpSocket.createConnection({ host, port }, () => {
    console.log(`[TCP Client] Connected to ${host}:${port}`);
    onConnected?.();

    let sentCount = 0;
    chunks.forEach((chunk) => {
      client.write(chunk);
      sentCount++;
      onProgress?.(sentCount, chunks.length);
    });

    client.end();
  });
  client.on("error", (err) => {
    console.error("[TCP Client Error]", err);
    onError?.(err);
  });

  client.on("close", () => {
    console.log("[TCP Client] Connection closed");
    onClose?.();
  });

  return client;
};
