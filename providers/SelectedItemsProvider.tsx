import { SelectedItemType, SelectedItemsType } from "@/types";
import { createContext, useContext, useState } from "react";
import uuid from "react-native-uuid";
const initialState: SelectedItemsType = {
  selectedItems: [],
  addToSelection: () => {},
  removeFromSelection: () => {},
  clearSelection: () => {},
};

const SelectedItemsContext = createContext(initialState);

export const SelectedItemsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedItems, setSelectedItems] = useState<SelectedItemType[]>([]);

  const addToSelection = (items: SelectedItemType[]) => {
    const filteredItems = items.filter(
      (item) =>
        !selectedItems.some(
          (i) =>
            i.type === item.type &&
            JSON.stringify(i.data) === JSON.stringify(item.data)
        )
    );
    const newItems = filteredItems.map((item) => {
      return {
        ...item,
        id: uuid.v4(),
      };
    });
    setSelectedItems([...selectedItems, ...newItems]);
  };

  const removeFromSelection = (id: string) => {
    setSelectedItems(selectedItems.filter((i) => i.id !== id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  return (
    <SelectedItemsContext.Provider
      value={{
        selectedItems,
        addToSelection,
        removeFromSelection,
        clearSelection,
      }}
    >
      {children}
    </SelectedItemsContext.Provider>
  );
};

export const useSelectedItems = () => useContext(SelectedItemsContext);

export default SelectedItemsProvider;
