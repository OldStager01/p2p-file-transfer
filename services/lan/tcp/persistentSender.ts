import TcpSocket from "react-native-tcp-socket";

let client: TcpSocket.Socket | null = null;
let pendingChunks: Map<number, { resolve: Function; reject: Function }> =
  new Map();
let connectionPromise: Promise<void> | null = null;
let isClosing = false;

export const initSender = async (host: string, port: number): Promise<void> => {
  if (client && !client.destroyed) {
    console.log("[Persistent TCP] Already connected");
    return;
  }

  isClosing = false;

  if (!connectionPromise) {
    connectionPromise = new Promise<void>((resolve, reject) => {
      try {
        client = TcpSocket.createConnection(
          {
            host,
            port,
            tls: false,
          },
          () => {
            console.log("[Persistent TCP] Connected");
            resolve();
          }
        );

        client.on("error", (err) => {
          console.error("[Persistent TCP] Socket error:", err);
          // Reject all pending promises
          pendingChunks.forEach(({ reject }) => reject(err));
          pendingChunks.clear();

          if (!isClosing) {
            reject(err);
          }
        });

        client.on("close", (hasError) => {
          console.log(
            `[Persistent TCP] Connection closed ${
              hasError ? "with error" : "without error"
            }`
          );
          client = null;
          connectionPromise = null;

          // Reject all pending promises with a connection closed error
          if (pendingChunks.size > 0) {
            const err = new Error("Connection closed");
            pendingChunks.forEach(({ reject }) => reject(err));
            pendingChunks.clear();
          }
        });

        client.on("data", (data) => {
          try {
            const response = JSON.parse(data.toString().trim());
            if (response.type === "ack" && pendingChunks.has(response.index)) {
              const { resolve } = pendingChunks.get(response.index)!;
              resolve(response);
              pendingChunks.delete(response.index);
            }
          } catch (err) {
            console.error("[Persistent TCP] Error parsing response:", err);
          }
        });
      } catch (err) {
        console.error("[Persistent TCP] Connection error:", err);
        connectionPromise = null;
        reject(err);
      }
    });
  }

  return connectionPromise;
};

export const sendEncryptedChunk = async (
  index: number,
  data: string,
  sessionId: string,
  metadata?: {
    fileName?: string;
    mimeType?: string;
    totalChunks?: number;
    isLastChunk?: boolean;
    isCompletionMessage?: boolean;
  }
): Promise<any> => {
  if (!client || client.destroyed) {
    throw new Error("TCP connection not established");
  }

  return new Promise((resolve, reject) => {
    try {
      // Store the promise callbacks for this chunk
      pendingChunks.set(index, { resolve, reject });

      // Create the chunk message
      const chunk = JSON.stringify({
        sessionId,
        index,
        data,
        ...metadata,
      });

      // Log first 20 chars of the chunk if it's not too large
      console.log(
        `[Persistent TCP] Sending chunk ${index}: ${
          chunk.length < 100 ? chunk : chunk.substring(0, 20) + "..."
        }`
      );

      // Set a timeout for ACK response
      const timeout = setTimeout(() => {
        if (pendingChunks.has(index)) {
          pendingChunks.delete(index);
          reject(new Error(`Timeout waiting for ACK on chunk ${index}`));
        }
      }, 10000); // 10 second timeout for ACK

      // Send the chunk with newline as terminator
      client!.write(chunk + "\n");
    } catch (err) {
      pendingChunks.delete(index);
      reject(err);
    }
  });
};

export const closeSender = async (): Promise<void> => {
  return new Promise((resolve) => {
    if (!client || client.destroyed) {
      console.log("[Persistent TCP] No active connection to close");
      resolve();
      return;
    }

    isClosing = true;

    console.log("[Persistent TCP] Waiting before closing connection...");
    // Add a small delay before closing to ensure any pending operations complete
    setTimeout(() => {
      if (client) {
        client.destroy();
        client = null;
      }
      connectionPromise = null;
      console.log("[Persistent TCP] Sender closed after delay");
      resolve();
    }, 1000);
  });
};
