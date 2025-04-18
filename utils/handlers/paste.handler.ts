import { ItemSource, SelectedItemType } from "@/types";
import { ItemType } from "@/types";
import Clipboard from "@react-native-clipboard/clipboard";
import { Alert } from "react-native";

export const handlePaste = (
  addToSelection: (items: SelectedItemType[]) => any
) => {
  return async () => {
    try {
      const content = await Clipboard.getString();
      if (content) {
        console.log("Pasted Content:", content);
        const data: SelectedItemType = {
          type: ItemType.Text,
          sorce: ItemSource.Clipboard,
          data: {
            content: content,
          },
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
