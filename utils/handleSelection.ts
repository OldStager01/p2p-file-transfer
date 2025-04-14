import DocumentPicker from "react-native-document-picker";
import Clipboard from "@react-native-clipboard/clipboard";
import { launchImageLibrary } from "react-native-image-picker";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import { SelectedItemType } from "@/providers/SelectedItemsProvider";
import { ItemType } from "@/types";

const requestStoragePermission = async () => {
  if (Platform.OS === "android") {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("You can use the storage");
    } else {
      console.log("Storage permission denied");
    }
  }
};

// Centralized error handler for DocumentPicker
const handlePickerError = (err: unknown) => {
  if (err instanceof Error) {
    // Alert.alert("Error", err.message);
    console.error("Document Picker Error:", err.message);
  }
};

export const handleSelectFile = (
  addToSelection: (items: SelectedItemType[]) => any
) => {
  return async () => {
    try {
      await requestStoragePermission();
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });
      console.log("Selected File(s):", res);

      if (Array.isArray(res)) {
        const data = res.map((item) => {
          return {
            type: ItemType.File,
            data: item,
          };
        });
        addToSelection(data);
      }

      // addItem('file', res);
    } catch (err) {
      handlePickerError(err);
    }
  };
};

export const handleSelectFolder = async () => {
  Alert.alert("Unsupported", "Folder selection is not implemented yet.");
};
export const handleSelectMedia = (
  addToSelection: (items: SelectedItemType[]) => any
) => {
  return async () => {
    try {
      await requestStoragePermission();

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
        const data = result.assets.map((item) => {
          return {
            type: ItemType.Media,
            data: item,
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

export const handleTextInput = (
  text: String,
  addToSelection: (items: SelectedItemType[]) => any
) => {
  const data = {
    type: ItemType.Text,
    data: text,
  };
  addToSelection([data]);
};

export const handlePaste = (
  addToSelection: (items: SelectedItemType[]) => any
) => {
  return async () => {
    try {
      const content = await Clipboard.getString();
      if (content) {
        console.log("Pasted Content:", content);
        const data = {
          type: ItemType.Text,
          data: content,
        };
        addToSelection([data]);
      } else {
        Alert.alert("Info", "Clipboard is empty.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to retrieve clipboard content.");
      console.error("Clipboard Error:", err);
    }
  };
};

export const handleSelectApp = () => {
  Alert.alert("Unsupported", "App selection is not implemented yet.");
};
