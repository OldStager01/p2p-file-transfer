import { Alert } from "react-native";
import { launchImageLibrary, Asset } from "react-native-image-picker";
import { ItemType, ItemSource, SelectedItemType } from "@/types";

const mapAssetToSelectedItem = (asset: Asset): SelectedItemType => {
  return {
    type: ItemType.Media,
    source: ItemSource.ImageLibrary,
    data: {
      name: asset.fileName ?? "Unnamed",
      uri: asset.uri ?? "",
      size: asset.fileSize ?? 0,
      mimeType: asset.type ?? "unknown",
    },
  };
};

export const handleSelectMedia = (
  addToSelection: (items: SelectedItemType[]) => void
) => {
  return async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: "mixed", // Supports images, videos, and possibly audio
        selectionLimit: 0, // 0 means unlimited selection
      });

      if (result.didCancel) {
        console.log("User cancelled media selection");
        return;
      }

      if (result.errorCode) {
        const message = `Media selection error: ${result.errorMessage}`;
        Alert.alert("Error", message);
        console.error("Media Picker Error:", message);
        return;
      }

      const assets = result.assets;
      if (assets?.length) {
        const selectedItems = assets.map(mapAssetToSelectedItem);
        console.log("Selected Media:", selectedItems);
        addToSelection(selectedItems);
      } else {
        console.log("No assets returned from media picker.");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An unexpected error occurred during media selection."
      );
      console.error("Media Picker Exception:", error);
    }
  };
};
