import { CHUNK_SIZE } from "@/constants/constants";
import * as FileSystem from "expo-file-system";

export async function* streamFileInChunks(uri: string, chunkSize = CHUNK_SIZE) {
  let offset = 0;
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) throw new Error("File does not exist");
  const size = info.size ?? 0;

  while (offset < size) {
    const chunk = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
      length: chunkSize,
      position: offset,
    });

    yield {
      index: Math.floor(offset / chunkSize),
      base64Chunk: chunk,
    };

    offset += chunkSize;
  }
}
