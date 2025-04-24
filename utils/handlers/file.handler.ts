import { ItemSource, SelectedItemType } from "@/types";
import { ItemType } from "@/types";
import { pick, types } from "@react-native-documents/picker";
import { handlePickerError } from "./pickerError.handler";
import RNFS from "react-native-fs";
import { Platform } from "react-native";

// Detect if file is image or video
const isMediaFile = (mimeType?: string) => {
  console.log("MIME TYPE:", mimeType);
  return mimeType?.startsWith("image/") || mimeType?.startsWith("video/");
};

// Convert content:// URI to file:// using RNFS (Android only)
const convertContentUriToFileUri = async (uri: string): Promise<string> => {
  if (Platform.OS === "android" && uri.startsWith("content://")) {
    const destPath = `${RNFS.TemporaryDirectoryPath}/${Date.now()}.tmp`;
    try {
      const base64 = await RNFS.readFile(uri, "base64");
      await RNFS.writeFile(destPath, base64, "base64");
      return "file://" + destPath;
    } catch (err) {
      console.warn("Failed to convert content URI to file URI:", err);
      return uri; // fallback to original URI
    }
  }
  return uri; // Already file:// or on iOS
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
        const data: SelectedItemType[] = await Promise.all(
          res.map(async (item) => {
            const isMedia = isMediaFile(item.type as string);
            const normalizedUri = isMedia
              ? await convertContentUriToFileUri(item.uri)
              : item.uri;

            return {
              type: isMedia ? ItemType.Media : ItemType.File,
              data: {
                name: item.name ?? "unknown",
                uri: normalizedUri,
                size: item.size ?? 0,
                mimeType: item.type ?? "application/octet-stream",
              },
              source: ItemSource.FilePicker,
            };
          })
        );

        console.log("Processed Selection:", data);
        addToSelection(data);
      }
    } catch (err) {
      handlePickerError(err);
    }
  };
};
