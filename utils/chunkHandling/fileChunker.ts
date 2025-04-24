import { CHUNK_SIZE } from "@/constants/constants";
import * as FileSystem from "expo-file-system";

export async function* streamFileInChunks(uri: string, chunkSize = CHUNK_SIZE) {
  let offset = 0;
  const info = await FileSystem.getInfoAsync(uri, { size: true });

  if (!info.exists) throw new Error(`File does not exist: ${uri}`);

  const size = info.size ?? 0;
  console.log(
    `Streaming file: ${uri}, size: ${size} bytes, chunk size: ${chunkSize} bytes`
  );

  while (offset < size) {
    const length = Math.min(chunkSize, size - offset);
    try {
      const chunk = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
        length,
        position: offset,
      });

      yield {
        index: Math.floor(offset / chunkSize),
        base64Chunk: chunk,
        isLastChunk: offset + length >= size,
      };

      offset += length;
    } catch (err) {
      console.error(`Error reading chunk at offset ${offset}:`, err);
      throw new Error(
        `Failed to read chunk at offset ${offset}: ${err.message}`
      );
    }
  }

  console.log(`File streaming complete: ${uri}`);
}
