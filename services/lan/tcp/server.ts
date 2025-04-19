import TcpSocket from "react-native-tcp-socket";
import { TcpServerOptions } from "./types";
export const startTcpServer = ({
  port = 8080,
  host = `0.0.0.0`,
  onChunkReceived,
  onConnection,
  onError,
  onClose,
}: TcpServerOptions) => {
  const server = TcpSocket.createServer((socket) => {
    const clientIp = socket.remoteAddress ?? "unknown";

    onConnection?.({ remoteAddress: clientIp });

    socket.on("data", (data) => {
      const chunk =
        typeof data === "string"
          ? Buffer.from(data, "utf-8")
          : Buffer.from(data);
      onChunkReceived(chunk, { remoteAddress: clientIp });
    });

    socket.on("error", (error) => {
      console.log("[TCP Server Error]", error);
      onError?.(error);
    });

    socket.on("close", () => {
      console.log("[TCP Server Closed]");
      onClose?.();
    });
  });

  server.listen({ port, host }, () => {
    console.log(`[TCP Server Started] Listening on ${host}:${port}`);
  });
};
