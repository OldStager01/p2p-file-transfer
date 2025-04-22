// services/sender.ts
import { Socket } from "net";
import { Buffer } from "buffer";

let clientSocket: Socket | null = null;

export function initSocketConnection(
  host: string,
  port: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    clientSocket = new Socket();

    clientSocket.connect(port, host, () => {
      console.log("Connected to receiver");
      resolve();
    });

    clientSocket.on("error", (err) => {
      console.log("Sender socket error:", err);
      reject(err);
    });

    clientSocket.on("close", () => {
      console.log("Sender socket closed");
      clientSocket = null;
    });
  });
}

export async function sendChunkToReceiver(index: number, chunkData: string) {
  if (!clientSocket) {
    throw new Error("TCP connection is not established.");
  }

  const chunkBuffer = Buffer.from(JSON.stringify({ index, chunkData }));

  return new Promise<void>((resolve, reject) => {
    clientSocket!.write(chunkBuffer, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function closeSenderConnection() {
  clientSocket?.destroy();
  clientSocket = null;
}
