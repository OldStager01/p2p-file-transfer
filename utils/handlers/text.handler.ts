import { ItemSource, SelectedItemType } from "@/types";
import { ItemType } from "@/types";

export const handleTextInput = (
  text: String,
  addToSelection: (items: SelectedItemType[]) => any
) => {
  if (!text) return;
  const data: SelectedItemType = {
    type: ItemType.Text,
    data: {
      content: text as string,
    },
    source: ItemSource.ManualInput,
  };
  addToSelection([data]);
};
