import { CHUNK_SIZE } from "@/constants/constants";
import * as FileSystem from "expo-file-system";
import * as RNFS from "react-native-fs";
import { Platform } from "react-native";

export async function* streamFileInChunks(uri: string, chunkSize = CHUNK_SIZE) {
  let offset = 0;

  // First check if file exists
  try {
    const info = await FileSystem.getInfoAsync(uri);

    if (!info.exists) {
      throw new Error(`File does not exist: ${uri}`);
    }

    const size = info.size ?? 0;
    console.log(
      `Streaming file: ${uri}, size: ${size} bytes, chunk size: ${chunkSize} bytes`
    );

    if (size === 0) {
      throw new Error(`File is empty: ${uri}`);
    }

    // Stream the file in chunks
    while (offset < size) {
      try {
        const length = Math.min(chunkSize, size - offset);
        let chunk;

        // Check if it's a content:// URI on Android that hasn't been converted
        if (Platform.OS === "android" && uri.startsWith("content://")) {
          // We can't use Expo FileSystem directly with content:// URIs
          throw new Error(
            `Cannot stream content:// URIs directly. Convert to a file:// URI first.`
          );
        } else {
          // Use Expo FileSystem for file:// URIs
          chunk = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
            length,
            position: offset,
          });
        }

        yield {
          index: Math.floor(offset / chunkSize),
          base64Chunk: chunk,
          isLastChunk: offset + length >= size,
        };

        offset += length;
      } catch (err: any) {
        console.error(`Error reading chunk at offset ${offset}:`, err);
        throw new Error(
          `Failed to read chunk at offset ${offset}: ${err.message}`
        );
      }
    }

    console.log(`File streaming complete: ${uri}`);
  } catch (err: any) {
    console.error(`Error accessing file ${uri}:`, err);
    throw new Error(`Failed to access file: ${err.message}`);
  }
}
