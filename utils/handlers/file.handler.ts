import { ItemSource, SelectedItemType } from "@/types";
import { ItemType } from "@/types";
import { pick, types } from "@react-native-documents/picker";
import { handlePickerError } from "./pickerError.handler";
import RNFS from "react-native-fs";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import * as mime from "react-native-mime-types";
import { CacheManager } from "../cacheManager";

// Detect if file is image or video
const isMediaFile = (mimeType?: string) => {
  console.log("MIME TYPE:", mimeType);
  return mimeType?.startsWith("image/") || mimeType?.startsWith("video/");
};

// Get file extension from MIME type or filename
const getFileExtension = (fileName: string, mimeType?: string): string => {
  // First try to get extension from filename
  const extensionFromName = fileName.split(".").pop();
  if (
    extensionFromName &&
    extensionFromName.length > 0 &&
    extensionFromName.length <= 5
  ) {
    return extensionFromName;
  }

  // Then try from MIME type
  if (mimeType) {
    const extensionFromMime = mime.extension(mimeType);
    if (extensionFromMime) {
      return extensionFromMime;
    }
  }

  // Default to binary
  return "bin";
};

// Convert content:// URI to file:// using proper methods for Android
const convertContentUriToFileUri = async (
  uri: string,
  fileName: string,
  mimeType?: string
): Promise<string> => {
  if (
    Platform.OS === "android" &&
    (uri.startsWith("content://") || uri.startsWith("file://"))
  ) {
    try {
      console.log(`[FilePicker] Converting URI: ${uri}`);

      // Generate a proper filename with extension
      const extension = getFileExtension(fileName, mimeType);
      const safeFileName = `${Date.now()}.${extension}`;
      const destPath = `${FileSystem.cacheDirectory}${safeFileName}`;

      console.log(`[FilePicker] Copying to: ${destPath}`);

      // For content:// URIs, we need to use copyAsync
      if (uri.startsWith("content://")) {
        // Use ReactNativeFS to read the file
        console.log(`[FilePicker] Using RNFS to copy content:// URI`);

        // Method 1: Use RNFS.copyFile if possible
        if (RNFS.copyFile) {
          try {
            await RNFS.copyFile(uri, destPath.replace("file://", ""));
            console.log(`[FilePicker] RNFS.copyFile succeeded`);
            return destPath;
          } catch (copyError) {
            console.warn(
              `[FilePicker] RNFS.copyFile failed: ${copyError}, trying alternative method`
            );
          }
        }

        // Method 2: Read and write using RNFS binary methods (more compatible)
        try {
          console.log(`[FilePicker] Using RNFS binary read/write`);
          // Create temp destination if needed
          const destPathDir = destPath.substring(0, destPath.lastIndexOf("/"));
          await RNFS.mkdir(destPathDir.replace("file://", ""), {
            NSURLIsExcludedFromBackupKey: true,
          });

          // Use RNFS methods that work directly with content:// URIs
          // Use append mode (false) which creates the file if it doesn't exist
          const fileStream = await RNFS.read(uri, 4096, 0, "base64");
          await RNFS.writeFile(
            destPath.replace("file://", ""),
            fileStream,
            "base64"
          );
          console.log(`[FilePicker] RNFS read/write succeeded`);
          return destPath;
        } catch (rnfsError) {
          console.warn(
            `[FilePicker] RNFS binary method failed: ${rnfsError}, trying CacheManager`
          );
        }

        // Method 3: Use CacheManager as fallback
        try {
          const cachedPath = await CacheManager.cacheFile(uri, safeFileName);
          console.log(`[FilePicker] CacheManager succeeded: ${cachedPath}`);
          return cachedPath;
        } catch (cacheError) {
          console.warn(`[FilePicker] CacheManager failed: ${cacheError}`);
        }
      }

      // For file:// URIs, we can use FileSystem.copyAsync directly
      if (uri.startsWith("file://")) {
        console.log(`[FilePicker] Copying file:// URI directly`);
        await FileSystem.copyAsync({
          from: uri,
          to: destPath,
        });
        return destPath;
      }

      // If all methods fail, return original URI as fallback
      console.warn(
        `[FilePicker] All conversion methods failed, using original URI`
      );
      return uri;
    } catch (err) {
      console.warn(`[FilePicker] Error converting URI: ${err}`);
      return uri; // fallback to original URI
    }
  }
  return uri; // Already appropriate URI or on iOS
};

export const handleSelectFile = (
  addToSelection: (items: SelectedItemType[]) => any
) => {
  return async () => {
    try {
      const res = await pick({
        type: [types.allFiles],
        allowMultiSelection: true,
        requestLongTermAccess: true,
        mode: "open",
      });

      if (Array.isArray(res)) {
        console.log(`[FilePicker] Selected ${res.length} files`);

        // Process files one by one to avoid memory issues with large files
        const data: SelectedItemType[] = [];

        for (const item of res) {
          try {
            console.log(`[FilePicker] Processing: ${item.name} (${item.type})`);
            const isMedia = isMediaFile(item.type as string);
            const normalizedUri = await convertContentUriToFileUri(
              item.uri,
              item.name ?? "unknown",
              item.type as string
            );

            data.push({
              type: isMedia ? ItemType.Media : ItemType.File,
              data: {
                name: item.name ?? "unknown",
                uri: normalizedUri,
                size: item.size ?? 0,
                mimeType: item.type ?? "application/octet-stream",
              },
              source: ItemSource.FilePicker,
            });

            console.log(
              `[FilePicker] Processed: ${item.name} → ${normalizedUri}`
            );
          } catch (itemError) {
            console.error(
              `[FilePicker] Error processing item ${item.name}: ${itemError}`
            );
          }
        }

        console.log(`[FilePicker] Processed ${data.length} files`);
        addToSelection(data);
      }
    } catch (err) {
      handlePickerError(err);
    }
  };
};
