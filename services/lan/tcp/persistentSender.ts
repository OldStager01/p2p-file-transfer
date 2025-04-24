import TcpSocket from "react-native-tcp-socket";

let client: TcpSocket.Socket | null = null;
let pendingChunks: Map<
  number,
  { resolve: Function; reject: Function; timer: NodeJS.Timeout }
> = new Map();
let connectionPromise: Promise<void> | null = null;
let isClosing = false;
export const initSender = async (host: string, port: number): Promise<void> => {
  // If we already have a client, close it properly first
  if (client) {
    try {
      await closeSender();
    } catch (err) {
      console.warn("[Persistent TCP] Error closing existing connection:", err);
    }
  }

  isClosing = false;

  if (!connectionPromise) {
    connectionPromise = new Promise<void>((resolve, reject) => {
      try {
        console.log(`[Persistent TCP] Connecting to ${host}:${port}...`);

        client = TcpSocket.createConnection(
          {
            host,
            port,
            tls: false,
          },
          () => {
            console.log("[Persistent TCP] Connected");
            // Clear the timeout when connected
            if (connectionTimeoutId) {
              clearTimeout(connectionTimeoutId);
              connectionTimeoutId = undefined;
            }
            resolve();
          }
        );

        // Set up a manual timeout
        let connectionTimeoutId: NodeJS.Timeout | undefined = setTimeout(() => {
          if (client && !client.destroyed) {
            console.error("[Persistent TCP] Connection timed out");
            // Destroy the socket if it exists
            client.destroy();
            client = null;
            reject(new Error("Connection timed out"));
          }
        }, 10000);

        // Also clear the timeout if there's an error
        client.once("error", () => {
          if (connectionTimeoutId) {
            clearTimeout(connectionTimeoutId);
            connectionTimeoutId = undefined;
          }
        });

        client.on("close", (hasError) => {
          console.log(
            `[Persistent TCP] Connection closed ${
              hasError ? "with error" : "normally"
            }`
          );

          // Clean up
          client = null;
          connectionPromise = null;

          // Reject all pending promises with a connection closed error
          if (pendingChunks.size > 0) {
            const err = new Error("Connection closed");
            for (const [
              index,
              { reject: rejectFn, timer },
            ] of pendingChunks.entries()) {
              clearTimeout(timer);
              rejectFn(err);
            }
            pendingChunks.clear();
          }
        });

        client.on("data", (data) => {
          try {
            // Process potentially multiple messages in one data packet
            const messages = data.toString().trim().split("\n");

            for (const message of messages) {
              if (!message.trim()) continue;

              const response = JSON.parse(message.trim());

              if (
                response.type === "ack" &&
                pendingChunks.has(response.index)
              ) {
                const { resolve: resolveFn, timer } = pendingChunks.get(
                  response.index
                )!;
                clearTimeout(timer);
                resolveFn(response);
                pendingChunks.delete(response.index);
                console.log(
                  `[Persistent TCP] Received ACK for chunk ${response.index}`
                );
              }
            }
          } catch (err) {
            console.error("[Persistent TCP] Error parsing response:", err);
          }
        });

        // Set a timeout for the connection
        const connectionTimeout = setTimeout(() => {
          if (client && !client.connecting) return; // Already connected

          console.error("[Persistent TCP] Connection timed out");
          reject(new Error("Connection timed out"));

          if (client) {
            client.destroy();
            client = null;
          }

          connectionPromise = null;
        }, 15000); // 15 second timeout

        // Clear the timeout once connected
        client.once("connect", () => {
          clearTimeout(connectionTimeout);
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
      // Create the chunk message
      const chunk = JSON.stringify({
        sessionId,
        index,
        data,
        ...metadata,
      });

      // Log chunk info (not the entire data)
      const logMessage = `[Persistent TCP] Sending chunk ${index}${
        metadata?.isLastChunk ? " (last chunk)" : ""
      }${metadata?.isCompletionMessage ? " (completion message)" : ""}: ${
        chunk.length
      } bytes`;
      console.log(logMessage);

      // Set a timeout for ACK response
      const timeout = setTimeout(() => {
        if (pendingChunks.has(index)) {
          pendingChunks.delete(index);
          reject(new Error(`Timeout waiting for ACK on chunk ${index}`));
        }
      }, 20000); // 20 second timeout for ACK - increased for large chunks

      // Store the promise callbacks for this chunk
      pendingChunks.set(index, { resolve, reject, timer: timeout });

      // Send the chunk with newline as terminator
      client!.write(chunk + "\n");
    } catch (err) {
      if (pendingChunks.has(index)) {
        clearTimeout(pendingChunks.get(index)!.timer);
        pendingChunks.delete(index);
      }
      reject(err);
    }
  });
};

export const closeSender = async (): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (!client) {
      console.log("[Persistent TCP] No active connection to close");
      resolve();
      return;
    }

    isClosing = true;

    console.log("[Persistent TCP] Waiting before closing connection...");

    // Add a small delay before closing to ensure any pending operations complete
    setTimeout(() => {
      if (client) {
        try {
          // First end the connection gracefully
          client.end();

          // Use the 'close' event instead for cleanup
          client.once("close", () => {
            console.log("[Persistent TCP] Connection ended properly");

            // Clear any remaining pending chunks
            for (const [
              index,
              { reject: rejectFn, timer },
            ] of pendingChunks.entries()) {
              clearTimeout(timer);
              rejectFn(new Error("Connection closed"));
            }
            pendingChunks.clear();

            client = null;
            connectionPromise = null;
            resolve();
          });

          // Set a timeout to force destroy if end doesn't complete
          setTimeout(() => {
            if (client) {
              console.log(
                "[Persistent TCP] Forcing connection closure after timeout"
              );
              client.destroy();
              client = null;
              connectionPromise = null;
              resolve();
            }
          }, 2000);
        } catch (err) {
          console.error("[Persistent TCP] Error ending connection:", err);

          // Fallback to destroy
          try {
            if (client) {
              client.destroy();
              client = null;
            }
          } catch (e) {
            // Ignore destroy errors
            console.warn("[Persistent TCP] Error destroying socket:", e);
          }

          connectionPromise = null;
          pendingChunks.clear();
          resolve();
        }
      } else {
        resolve();
      }
    }, 1000);
  });
};

// Function to check if the client is connected
export const isConnected = (): boolean => {
  return !!client && !client.destroyed && !client.connecting;
};

// Function to reset the sender state completely
export const resetSenderState = () => {
  if (client) {
    try {
      client.destroy();
    } catch (e) {
      // Ignore errors
    }
    client = null;
  }

  // Clear all pending chunks and their timers
  for (const [_, { timer }] of pendingChunks.entries()) {
    clearTimeout(timer);
  }
  pendingChunks.clear();

  connectionPromise = null;
  isClosing = false;

  console.log("[Persistent TCP] Sender state reset completely");
};
