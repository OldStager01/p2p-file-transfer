import {
  initSender,
  sendEncryptedChunk,
  closeSender,
} from "@/services/lan/tcp/persistentSender";
import { encryptChunk } from "../encryption/encryptor";
import { streamFileInChunks } from "../chunkHandling/fileChunker";
import pLimit from "p-limit";
import uuid from "react-native-uuid";
import { LocalDeviceType } from "@/types";

const concurrencyLimit = 1;
const limit = pLimit(concurrencyLimit);

// Modified chunk processing with retries
export async function processChunksOnTheFly(
  fileUri: string,
  onChunkSent?: (index: number, status: string) => void,
  device?: LocalDeviceType
) {
  if (!device?.ip) {
    throw new Error("Device IP is required");
  }

  const host = device.ip;
  const port = 12345;
  const sessionId = uuid.v4(); // Unique session ID per file
  const MAX_RETRIES = 3;

  try {
    // Initialize the sender and keep the connection open
    await initSender(host, port);
    console.log(`TCP connection established to ${host}:${port}`);

    const chunks = [];
    let chunkIndex = 0;

    // First, get all chunks and store them
    for await (const { index, base64Chunk } of streamFileInChunks(fileUri)) {
      chunks.push({ index, base64Chunk });
      chunkIndex = Math.max(chunkIndex, index);
    }

    console.log(`Total chunks to process: ${chunks.length}`);

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
                `Transferring Chunk ${index} of ${chunks.length} (Attempt ${attempts})`
              );
              onChunkSent?.(index, `⏳ started (Attempt ${attempts})`);

              const encrypted = await encryptChunk(base64Chunk, index);
              await sendEncryptedChunk(index, encrypted.data, sessionId);

              console.log(
                `Chunk ${index} of ${chunks.length} successfully sent`
              );
              onChunkSent?.(index, "✅ sent");
              success = true;
            } catch (err: any) {
              lastError = err;
              console.error(
                `[Chunk #${index}] Error (Attempt ${attempts}):`,
                err
              );
              onChunkSent?.(index, `⚠️ retrying: ${err.message}`);

              // Wait before retry
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }

          if (!success) {
            onChunkSent?.(
              index,
              `❌ failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
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

    console.log(`All ${chunks.length} chunks processed successfully`);

    // Add a delay before closing to ensure all data has been transmitted
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (err) {
    console.error("Error during file processing:", err);
    throw err;
  } finally {
    // Only close the sender after all chunks are transferred or on error
    console.log("Closing TCP connection...");
    await closeSender();
    console.log("[Persistent TCP] All chunks sent, sender closed.");
  }
}
async function isSettled(p: Promise<any>): Promise<boolean> {
  const marker = Symbol();
  return Promise.race([p, Promise.resolve(marker)]).then(
    (v) => v !== marker,
    () => true
  );
}
