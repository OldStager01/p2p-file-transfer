import {
  initSender,
  sendEncryptedChunk,
  closeSender,
} from "@/services/lan/tcp/persistentSender";
import { encryptChunk } from "../encryption/encryptor";
import { streamFileInChunks } from "../chunkHandling/fileChunker";
import * as FileSystem from "expo-file-system";
import * as mime from "react-native-mime-types";
// import * as path from "path-browserify";
import pLimit from "p-limit";
import uuid from "react-native-uuid";
import { LocalDeviceType } from "@/types";

const concurrencyLimit = 1;
const limit = pLimit(concurrencyLimit);

// Enhanced version with metadata and last chunk signals
export async function processChunksOnTheFly(
  fileUri: string,
  onChunkSent?: (index: number, status: string, progress?: number) => void,
  device?: LocalDeviceType
) {
  if (!device?.ip) {
    throw new Error("Device IP is required");
  }

  const host = device.ip;
  const port = 12345;
  const sessionId = uuid.v4().toString(); // Ensure it's a string
  const MAX_RETRIES = 3;

  try {
    // Make sure the file exists and is readable
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error(`File does not exist: ${fileUri}`);
    }

    // Initialize the sender and keep the connection open
    await initSender(host, port);
    console.log(`TCP connection established to ${host}:${port}`);

    // Extract filename from URI
    const pathParts = fileUri.split("/");
    const fileName = pathParts[pathParts.length - 1];

    // Get MIME type based on file extension
    const extension = fileName.split(".").pop() || "";
    const mimeType = mime.lookup(extension) || "application/octet-stream";

    console.log(
      `[ChunkProcessor] Processing file: ${fileName}, MIME: ${mimeType}`
    );

    const chunks = [];
    let chunkIndex = 0;

    // First, get all chunks
    try {
      for await (const { index, base64Chunk } of streamFileInChunks(fileUri)) {
        chunks.push({ index, base64Chunk });
        chunkIndex = Math.max(chunkIndex, index);
      }
    } catch (error: any) {
      console.error(`[ChunkProcessor] Error reading file chunks:`, error);
      throw new Error(`Failed to read file chunks: ${error.message || error}`);
    }

    const totalChunks = chunks.length;
    console.log(`[ChunkProcessor] Total chunks to process: ${totalChunks}`);

    // Process all chunks with controlled concurrency and retries
    await Promise.all(
      chunks.map(({ index, base64Chunk }) =>
        limit(async () => {
          let attempts = 0;
          let success = false;
          let lastError = null;

          while (attempts < MAX_RETRIES && !success) {
            try {
              attempts++;
              console.log(
                `[ChunkProcessor] Transferring Chunk ${index} of ${totalChunks} (Attempt ${attempts})`
              );
              onChunkSent?.(
                index,
                `⏳ started (Attempt ${attempts})`,
                index / totalChunks
              );

              const encrypted = await encryptChunk(base64Chunk, index);

              // Include file metadata with each chunk and mark last chunk
              await sendEncryptedChunk(index, encrypted.data, sessionId, {
                fileName,
                mimeType,
                totalChunks,
                isLastChunk: index === totalChunks - 1,
              });

              console.log(
                `[ChunkProcessor] Chunk ${index} of ${totalChunks} successfully sent`
              );
              onChunkSent?.(index, "✅ sent", (index + 1) / totalChunks);
              success = true;
            } catch (err: any) {
              lastError = err;
              console.error(
                `[Chunk #${index}] Error (Attempt ${attempts}):`,
                err
              );
              onChunkSent?.(
                index,
                `⚠️ retrying: ${err.message}`,
                index / totalChunks
              );

              // Wait before retry
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * attempts)
              ); // Progressive backoff
            }
          }

          if (!success) {
            onChunkSent?.(
              index,
              `❌ failed after ${MAX_RETRIES} attempts: ${lastError?.message}`,
              index / totalChunks
            );
            throw (
              lastError ||
              new Error(
                `Failed to send chunk ${index} after ${MAX_RETRIES} attempts`
              )
            );
          }
        })
      )
    );

    console.log(
      `[ChunkProcessor] All ${totalChunks} chunks processed successfully`
    );

    // Send a final completion message
    try {
      await sendEncryptedChunk(-1, "", sessionId, {
        fileName,
        mimeType,
        totalChunks,
        isLastChunk: true,
        isCompletionMessage: true,
      });
      console.log("[ChunkProcessor] Sent final completion message");
    } catch (err) {
      console.warn("[ChunkProcessor] Failed to send completion message:", err);
      // Non-critical error, continue
    }

    // Add a delay before closing to ensure all data has been transmitted
    await new Promise((resolve) => setTimeout(resolve, 3000));
  } catch (err) {
    console.error("[ChunkProcessor] Error during file processing:", err);
    throw err;
  } finally {
    // Only close the sender after all chunks are transferred or on error
    console.log("[ChunkProcessor] Closing TCP connection...");
    await closeSender();
    console.log("[ChunkProcessor] All chunks sent, sender closed.");
  }
}
