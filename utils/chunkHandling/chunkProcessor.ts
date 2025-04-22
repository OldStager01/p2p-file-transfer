import { streamFileInChunks } from "../chunkHandling/fileChunker";
import { encryptChunk, EncryptedChunk } from "../encryption/encryptor";
import { sender } from "@/services/sender";
import pLimit from "p-limit";

const concurrencyLimit = 3;
const limit = pLimit(concurrencyLimit);

export async function processChunksOnTheFly(
  fileUri: string,
  onChunkSent?: (index: number, encrypted: string) => void
) {
  const iterator = streamFileInChunks(fileUri)[Symbol.asyncIterator]();
  const runningTasks: Promise<void>[] = [];

  let chunkResult = await iterator.next();

  while (!chunkResult.done) {
    const { index, base64Chunk } = chunkResult.value;

    const task = limit(async () => {
      onChunkSent?.(index, "⏳ started");

      const encryptedChunk: EncryptedChunk = await encryptChunk(
        base64Chunk,
        index
      );
      await sender(index, encryptedChunk);

      onChunkSent?.(index, "✅ sent");
    });

    runningTasks.push(task);

    if (runningTasks.length >= concurrencyLimit) {
      await Promise.race(runningTasks);
      // Remove settled promises
      for (let i = runningTasks.length - 1; i >= 0; i--) {
        if (await isSettled(runningTasks[i])) {
          runningTasks.splice(i, 1);
        }
      }
    }

    chunkResult = await iterator.next();
  }

  await Promise.all(runningTasks);
}

async function isSettled(p: Promise<any>): Promise<boolean> {
  const marker = Symbol();
  return Promise.race([p, Promise.resolve(marker)]).then(
    (value) => value !== marker,
    () => true
  );
}
