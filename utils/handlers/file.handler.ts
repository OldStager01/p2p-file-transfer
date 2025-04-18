import { ItemSource, SelectedItemType } from "@/types";
import { ItemType } from "@/types";
import { pick, types } from "@react-native-documents/picker";
import { handlePickerError } from "./pickerError.handler";

export const handleSelectFile = (
  addToSelection: (items: SelectedItemType[]) => any
) => {
  return async () => {
    try {
      const res = await pick({
        type: [types.allFiles],
        allowMultiSelection: true,
      });
      console.log("Selected File(s):", res);

      if (Array.isArray(res)) {
        const data: SelectedItemType[] = res.map((item) => {
          return {
            type: ItemType.File,
            data: {
              name: item.name as string,
              uri: item.uri,
              size: item.size as number,
              mimeType: item.type as string,
            },
            source: ItemSource.FilePicker,
          };
        });
        addToSelection(data);
      }
    } catch (err) {
      handlePickerError(err);
    }
  };
};
