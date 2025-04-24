import { FileReassembler } from "@/utils/chunkHandling/fileReassembler";
import TcpSocket from "react-native-tcp-socket";
FileReassembler;
let server: TcpSocket.Server | null = null;
let fileReassembler: FileReassembler | null = null;
let isServerRunning = false;
let activeClients: Map<number, TcpSocket.Socket> = new Map();
let nextClientId = 1000;
let socketBuffers: Map<number, string> = new Map(); // Track buffers for each socket
let pendingOperations: Map<number, number> = new Map(); // Track pending operations

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
  onConnection?: (info: { remoteAddress: string; remotePort: number }) => void;
  onChunkReceived?: (
    chunk: any,
    info: { remoteAddress: string; remotePort: number }
  ) => void;
  onFileComplete?: (fileUri: string, fileName: string) => void;
  onTransferProgress?: (
    sessionId: string,
    receivedChunks: number,
    totalChunks?: number
  ) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}) => {
  if (isServerRunning) {
    console.log("[TCP Server] Server already running, stopping first");
    try {
      stopTcpServer();
      // Wait to ensure the port is released
      return new Promise((resolve) => {
        setTimeout(() => {
          startTcpServerInternal({
            port,
            host,
            onConnection,
            onChunkReceived,
            onFileComplete,
            onTransferProgress,
            onError,
            onClose,
          }).then(resolve);
        }, 1000);
      });
    } catch (err) {
      console.error("[TCP Server] Error stopping existing server:", err);
    }
  }

  return startTcpServerInternal({
    port,
    host,
    onConnection,
    onChunkReceived,
    onFileComplete,
    onTransferProgress,
    onError,
    onClose,
  });
};

const startTcpServerInternal = ({
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
  onConnection?: (info: { remoteAddress: string; remotePort: number }) => void;
  onChunkReceived?: (
    chunk: any,
    info: { remoteAddress: string; remotePort: number }
  ) => void;
  onFileComplete?: (fileUri: string, fileName: string) => void;
  onTransferProgress?: (
    sessionId: string,
    receivedChunks: number,
    totalChunks?: number
  ) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}) => {
  // Reset client tracking
  activeClients.clear();
  socketBuffers.clear();
  pendingOperations.clear();
  nextClientId = 1000;

  // Initialize file reassembler
  fileReassembler = new FileReassembler((sessionId, received, total) => {
    onTransferProgress?.(sessionId, received, total);
  });

  return new Promise((resolve, reject) => {
    try {
      // Create TCP server
      server = TcpSocket.createServer((socket) => {
        // Assign an ID to this socket
        const clientId = nextClientId++;

        // Store socket in the active clients map
        activeClients.set(clientId, socket);
        socketBuffers.set(clientId, ""); // Initialize empty buffer
        pendingOperations.set(clientId, 0); // Initialize pending operations counter

        console.log(
          `[TCP Server] Client #${clientId} connected from ${socket.remoteAddress}:${socket.remotePort}`
        );

        onConnection?.({
          remoteAddress: socket.remoteAddress || "unknown",
          remotePort: socket.remotePort || 0,
        });

        // Handle incoming data
        socket.on("data", (data) => {
          // Mark the start of a data processing operation
          pendingOperations.set(
            clientId,
            (pendingOperations.get(clientId) || 0) + 1
          );

          console.log(
            `[TCP Server] Client #${clientId} - Received data chunk: ${data.length} bytes`
          );

          try {
            // Get the buffer for this socket
            let buffer = socketBuffers.get(clientId) || "";

            // Make sure data is a string
            const dataStr =
              typeof data === "string" ? data : data.toString("utf8");
            buffer += dataStr;

            // Update the buffer
            socketBuffers.set(clientId, buffer);

            // Process complete messages (terminated by newline)
            let boundaryIndex;
            while ((boundaryIndex = buffer.indexOf("\n")) >= 0) {
              const raw = buffer.slice(0, boundaryIndex).trim();
              buffer = buffer.slice(boundaryIndex + 1);

              // Update the buffer
              socketBuffers.set(clientId, buffer);

              if (!raw) continue;

              try {
                // Parse the JSON message
                const parsed = JSON.parse(raw);
                console.log(
                  `[TCP Server] Client #${clientId} - Processed chunk ${parsed.index}:`,
                  parsed.data
                    ? `${parsed.data.slice(0, 20)}... (${
                        parsed.data.length
                      } bytes)`
                    : "No data"
                );

                // Notify listeners
                onChunkReceived?.(parsed, {
                  remoteAddress: socket.remoteAddress || "unknown",
                  remotePort: socket.remotePort || 0,
                });

                // Process chunk through the reassembler
                if (fileReassembler && parsed.sessionId) {
                  // Register completion callback for this session
                  if (onFileComplete) {
                    fileReassembler.onFileComplete(
                      parsed.sessionId,
                      onFileComplete
                    );
                  }

                  // Process the chunk
                  fileReassembler.processChunk({
                    ...parsed,
                    originalPath: parsed.fileName || "",
                  });

                  // Handle last chunk logic
                  if (parsed.isLastChunk || parsed.isCompletionMessage) {
                    console.log(
                      `[TCP Server] Last chunk received for ${parsed.sessionId}, scheduling reassembly`
                    );
                    setTimeout(() => {
                      if (fileReassembler) {
                        fileReassembler.forceCompleteSession(parsed.sessionId);
                      }
                    }, 1000);
                  }
                }

                // Send acknowledgment back to sender
                if (activeClients.has(clientId)) {
                  try {
                    const ack = JSON.stringify({
                      type: "ack",
                      sessionId: parsed.sessionId,
                      index: parsed.index,
                    });

                    // Increment pending operations before sending ACK
                    pendingOperations.set(
                      clientId,
                      (pendingOperations.get(clientId) || 0) + 1
                    );

                    socket.write(ack + "\n");
                    pendingOperations.set(
                      clientId,
                      Math.max(0, (pendingOperations.get(clientId) || 0) - 1)
                    );
                  } catch (writeErr) {
                    console.error(
                      `[TCP Server] Client #${clientId} - Error preparing/sending ACK:`,
                      writeErr
                    );
                    // Decrement pending operations if ACK fails
                    pendingOperations.set(
                      clientId,
                      Math.max(0, (pendingOperations.get(clientId) || 0) - 1)
                    );
                  }
                } else {
                  console.warn(
                    `[TCP Server] Cannot send ACK - Client #${clientId} no longer registered`
                  );
                }
              } catch (jsonErr) {
                console.error(
                  `[TCP Server] Client #${clientId} - Failed to parse JSON:`,
                  jsonErr
                );
              }
            }
          } catch (err) {
            console.error(
              `[TCP Server] Client #${clientId} - Error processing data:`,
              err
            );
          } finally {
            // Always decrement the pending operations counter when done
            pendingOperations.set(
              clientId,
              Math.max(0, (pendingOperations.get(clientId) || 0) - 1)
            );
          }
        });

        // Handle socket errors - IMPROVED
        socket.on("error", (err) => {
          console.error(
            `[TCP Server] Client #${clientId} - Socket error:`,
            err
          );
          // DO NOT remove the socket from activeClients map here
          // Just log the error, let the close handler manage removal
        });

        // Handle socket close - IMPROVED with safety delay
        socket.on("close", (hasError) => {
          console.log(
            `[TCP Server] Client #${clientId} - Connection closed ${
              hasError ? "with error" : "normally"
            }`
          );

          // Check if there are pending operations before removing the socket
          const pendingOps = pendingOperations.get(clientId) || 0;

          if (pendingOps > 0) {
            console.log(
              `[TCP Server] Client #${clientId} - Delaying cleanup for ${pendingOps} pending operations`
            );

            // Wait a bit before cleanup to ensure all operations complete
            setTimeout(() => {
              console.log(
                `[TCP Server] Client #${clientId} - Cleanup after delay`
              );
              socketBuffers.delete(clientId);
              pendingOperations.delete(clientId);
              activeClients.delete(clientId);

              // Notify listeners about the closure (only if this was the last client)
              if (activeClients.size === 0) {
                onClose?.();
              }
            }, 2000); // 2 second delay to ensure pending operations are truly complete
          } else {
            // Immediate cleanup if no pending operations
            console.log(
              `[TCP Server] Client #${clientId} - Immediate cleanup (no pending operations)`
            );
            socketBuffers.delete(clientId);
            pendingOperations.delete(clientId);
            activeClients.delete(clientId);

            // Notify listeners about the closure (only if this was the last client)
            if (activeClients.size === 0) {
              onClose?.();
            }
          }
        });
      });

      // Handle server errors
      server.on("error", (err) => {
        console.error("[TCP Server] Server error:", err);
        onError?.(err);

        if (
          err.message &&
          (err.message.includes("EADDRINUSE") ||
            err.message.includes("Address already in use"))
        ) {
          isServerRunning = false;
          reject(err);
        }
      });

      // Start listening
      server.listen({ port, host }, () => {
        console.log(`[TCP Server] Listening on ${host}:${port}`);
        isServerRunning = true;

        resolve({
          stop: stopTcpServer,
          getActiveTransfers: () => {
            return fileReassembler?.getActiveSessions() || {};
          },
          forceCompleteAll: () => {
            fileReassembler?.forceCheckAllSessions();
            return true;
          },
        });
      });
    } catch (err) {
      console.error("[TCP Server] Error creating server:", err);
      isServerRunning = false;
      reject(err);
    }
  });
};

export const stopTcpServer = () => {
  // First make sure we're not interrupting active transfers
  const activeSessions = fileReassembler?.getActiveSessions() || {};
  const hasActiveSessions = Object.keys(activeSessions).length > 0;

  if (hasActiveSessions) {
    console.log(
      `[TCP Server] Active file transfers in progress. Scheduling completion check...`
    );
    // Force complete all sessions before stopping
    fileReassembler?.forceCheckAllSessions();
    // Add a delay to allow any final operations to complete
    setTimeout(() => {
      console.log(
        "[TCP Server] Stopping server after completing active transfers"
      );
      actuallyStopServer();
    }, 3000);
  } else {
    actuallyStopServer();
  }
};

const actuallyStopServer = () => {
  // Close all active client connections first with a grace period
  for (const [clientId, socket] of activeClients.entries()) {
    try {
      console.log(
        `[TCP Server] Closing client #${clientId} connection gracefully`
      );

      // Set a flag on the socket to prevent new operations
      (socket as any).__closing = true;

      // First try to end gracefully
      socket.end();

      // Set a timeout to force destroy if end doesn't complete
      setTimeout(() => {
        if (activeClients.has(clientId)) {
          console.log(
            `[TCP Server] Force closing client #${clientId} connection after timeout`
          );
          socket.destroy();
        }
      }, 2000);
    } catch (err) {
      console.error(`[TCP Server] Error closing client #${clientId}:`, err);
      // Force destroy on error
      try {
        socket.destroy();
      } catch (e) {
        // Ignore destroy errors
      }
    }
  }

  // Add a delay before closing the server to allow clients to disconnect gracefully
  setTimeout(() => {
    // Clear the active clients map
    activeClients.clear();
    socketBuffers.clear();
    pendingOperations.clear();

    // Close the server
    if (server) {
      try {
        server.close(() => {
          console.log("[TCP Server] Server closed successfully");
          server = null;
          fileReassembler = null;
          isServerRunning = false;
        });
        console.log("[TCP Server] Server closing...");
      } catch (err) {
        console.error("[TCP Server] Error closing server:", err);
        server = null;
        fileReassembler = null;
        isServerRunning = false;
      }
    } else {
      console.log("[TCP Server] No server to stop");
    }
  }, 1000);
};
