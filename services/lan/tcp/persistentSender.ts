import TcpSocket from "react-native-tcp-socket";
import { Buffer } from "buffer";

let client: TcpSocket.Socket | null = null;
let healthCheckInterval: NodeJS.Timeout | null = null;

export const startHealthCheck = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }

  healthCheckInterval = setInterval(() => {
    if (client && client.writableNeedDrain) {
      try {
        // Send a ping message
        client.write(Buffer.from(JSON.stringify({ type: "ping" }) + "\n"));
      } catch (err) {
        console.error("[Persistent TCP] Health check failed:", err);
      }
    } else if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
  }, 5000); // Check every 5 seconds
};
export const initSender = (host: string, port: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Add timeout handling
    const connectionTimeout = setTimeout(() => {
      reject(new Error("Connection timed out"));
    }, 10000); // 10 second timeout

    client = TcpSocket.createConnection({ host, port }, () => {
      clearTimeout(connectionTimeout);
      console.log("[Persistent TCP] Connected");
      resolve();
    });

    // Add reconnection logic
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;

    client.on("error", (err) => {
      console.error("[Persistent TCP Error]", err);

      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(
          `[Persistent TCP] Reconnecting (attempt ${reconnectAttempts})...`
        );

        // Destroy existing client and create new connection
        client?.destroy();

        // Wait before reconnecting with exponential backoff
        setTimeout(() => {
          client = TcpSocket.createConnection({ host, port }, () => {
            console.log("[Persistent TCP] Reconnected successfully");
            reconnectAttempts = 0;
          });
        }, 1000 * Math.pow(2, reconnectAttempts));
      } else {
        client?.destroy();
        client = null;
        reject(err);
      }
    });
    client = TcpSocket.createConnection({ host, port }, () => {
      console.log("[Persistent TCP] Connected");
      resolve();
    });

    client.on("connect", () => {
      console.log("[Persistent TCP] Connected");
      startHealthCheck();
      resolve();
    });

    client.on("error", (err) => {
      console.error("[Persistent TCP Error]", err);
      client?.destroy();
      client = null;
      reject(err);
    });

    client.on("close", () => {
      console.log("[Persistent TCP] Connection closed");
      client?.destroy();
      client = null;
    });
  });
};

export const sendEncryptedChunk = (
  index: number,
  encryptedChunk: string,
  sessionId: string
) => {
  if (!client) throw new Error("TCP client not initialized");

  const payload = JSON.stringify({
    sessionId,
    index,
    data: encryptedChunk,
  });

  console.log(
    `[Persistent TCP] Sending chunk ${index}:`,
    payload.toString().slice(0, 20)
  );

  // Ensure the message is terminated with a newline character
  client.write(Buffer.from(payload + "\n"));
};

export const closeSender = async () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
  // Add a more substantial delay to ensure all data is flushed
  console.log("[Persistent TCP] Waiting before closing connection...");
  await new Promise((resolve) => setTimeout(resolve, 3000)); // Increased to 3 seconds

  return new Promise((resolve) => {
    if (!client) {
      console.log("[Persistent TCP] No active connection to close");
      return resolve("No active connection to close");
    }

    client.once("close", () => {
      console.log("[Persistent TCP] Sender closed after delay");
      client = null;
      resolve("Sender closed after delay");
    });

    client.end();
  });
};
