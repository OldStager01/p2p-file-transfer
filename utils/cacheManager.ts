import * as FileSystem from "expo-file-system";
import * as RNFS from "react-native-fs";
import { Platform } from "react-native";

export class CacheManager {
  static async cacheFile(uri: string, fileName: string): Promise<string> {
    // Create cache directory if it doesn't exist
    const cacheDir = `${FileSystem.cacheDirectory}FileTransfer/`;
    try {
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }
    } catch (err) {
      console.warn(`[CacheManager] Error creating cache directory: ${err}`);
    }

    // Target destination for cached file
    const destination = `${cacheDir}${fileName}`;

    if (Platform.OS === "android" && uri.startsWith("content://")) {
      try {
        // Use react-native-blob-util for better content:// URI handling
        if (uri.includes("com.android.providers.downloads")) {
          // Special case for Downloads provider
          console.log(`[CacheManager] Handling Downloads provider URI`);

          // Try RNFS.stat to get real path (works on some Android versions)
          try {
            const statResult = await RNFS.stat(uri);
            if (
              statResult.originalFilepath &&
              statResult.originalFilepath.startsWith("/")
            ) {
              // We got the real file path, use it directly
              console.log(
                `[CacheManager] Got real path: ${statResult.originalFilepath}`
              );

              // Copy to our destination
              await RNFS.copyFile(
                statResult.originalFilepath,
                destination.replace("file://", "")
              );
              return destination;
            }
          } catch (statError) {
            console.warn(`[CacheManager] RNFS.stat failed: ${statError}`);
          }
        }

        // Use RNFS to read the file directly with binary chunks
        // This is more compatible with content:// URIs
        try {
          console.log(`[CacheManager] Reading file with RNFS binary chunking`);

          // Get file size first to know how much to read
          const fileInfo = await RNFS.stat(uri);
          const fileSize = fileInfo.size || 0;

          // Create output file
          const fd = await RNFS.write(
            destination.replace("file://", ""),
            "",
            0
          );

          // Read in chunks of 1MB
          const chunkSize = 1024 * 1024;
          for (let offset = 0; offset < fileSize; offset += chunkSize) {
            const size = Math.min(chunkSize, fileSize - offset);
            const chunk = await RNFS.read(uri, size, offset, "base64");
            await RNFS.appendFile(
              destination.replace("file://", ""),
              chunk,
              "base64"
            );
          }

          console.log(
            `[CacheManager] Successfully copied file to ${destination}`
          );
          return destination;
        } catch (readError) {
          console.warn(`[CacheManager] RNFS chunked read failed: ${readError}`);
        }

        throw new Error("Could not cache file from content:// URI");
      } catch (err) {
        console.error(`[CacheManager] Failed to cache file: ${err}`);
        throw err;
      }
    } else {
      // For file:// URIs or on iOS, we can use FileSystem.copyAsync
      try {
        await FileSystem.copyAsync({
          from: uri,
          to: destination,
        });
        return destination;
      } catch (copyError) {
        console.error(
          `[CacheManager] FileSystem.copyAsync failed: ${copyError}`
        );
        throw copyError;
      }
    }
  }

  static async clearCache(): Promise<void> {
    try {
      const cacheDir = `${FileSystem.cacheDirectory}FileTransfer/`;
      const info = await FileSystem.getInfoAsync(cacheDir);
      if (info.exists) {
        await FileSystem.deleteAsync(cacheDir, { idempotent: true });
        console.log(`[CacheManager] Cache cleared`);
      }
    } catch (err) {
      console.warn(`[CacheManager] Error clearing cache: ${err}`);
    }
  }
}
