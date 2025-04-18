import { SelectedItemType } from "@/providers/SelectedItemsProvider";
import { ItemType } from "@/types";

export const handleTextInput = (
  text: String,
  addToSelection: (items: SelectedItemType[]) => any
) => {
  if (!text) return;
  const data = {
    type: ItemType.Text,
    data: text,
  };
  addToSelection([data]);
};
