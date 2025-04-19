import { ItemSource, SelectedItemType } from "@/types";
import { ItemType } from "@/types";
import { pickDirectory } from "@react-native-documents/picker";
import { handlePickerError } from "./pickerError.handler";

export const handleSelectFolder = (
  addToSelection: (items: SelectedItemType[]) => void
) => {
  return async () => {
    try {
      const res = await pickDirectory({ requestLongTermAccess: true });

      console.log("Selected Folder:", res);

      if (res.bookmarkStatus !== "success") {
        console.warn("Folder selection failed:", res.bookmarkError);
        return;
      }

      const nameFromUri =
        res.uri
          ?.split("/")
          .filter(Boolean)
          .pop()
          ?.split("%3A")
          .pop()
          ?.split("%2F")
          .pop() ?? "Unnamed Folder";
      console.log("Folder Name:", nameFromUri);
      const folderItem: SelectedItemType = {
        type: ItemType.Folder,
        data: {
          name: nameFromUri,
          uri: res.uri,
          bookmark: res.bookmark,
        },
        source: ItemSource.FolderPicker,
      };

      addToSelection([folderItem]);
    } catch (err) {
      console.error("Error selecting folder:", err);
      handlePickerError(err);
    }
  };
};
