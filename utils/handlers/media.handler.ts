import { ItemSource, SelectedItemType } from "@/types";
import { ItemType } from "@/types";
import { Alert } from "react-native";
import { launchImageLibrary } from "react-native-image-picker";

export const handleSelectMedia = (
  addToSelection: (items: SelectedItemType[]) => any
) => {
  return async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: "mixed",
        selectionLimit: 0, // 0 allows unlimited selection
      });

      if (result.didCancel) {
        // User canceled the operation; no action needed
        return;
      }

      if (result.errorCode) {
        Alert.alert("Error", `Media selection error: ${result.errorMessage}`);
        console.error("Media Picker Error:", result.errorMessage);
        return;
      }

      if (result.assets?.length) {
        console.log("Selected Media:", result.assets);
        const data: SelectedItemType[] = result.assets.map((item) => {
          return {
            type: ItemType.Media,
            source: ItemSource.ImageLibrary,
            data: {
              name: item.fileName as string,
              uri: item.uri as string,
              size: item.fileSize as number,
              mimeType: item.type as string,
            },
          };
        });
        addToSelection(data);
        // addItem('media', result.assets);
      }
    } catch (err) {
      Alert.alert(
        "Error",
        "An unexpected error occurred during media selection."
      );
      console.error("Media Picker Exception:", err);
    }
  };
};
