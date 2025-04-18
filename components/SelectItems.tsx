import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import SelectTypeCard from "./SelectTypeCard";
import { useTheme } from "@react-navigation/native";
import { FontAwesomeIconName } from "@/types";
import {
  handlePaste,
  handleSelectApp,
  handleSelectFile,
  handleSelectFolder,
  handleSelectMedia,
} from "@/utils/handlers";
import TextInputModal from "./TextInputModal";
import { useSelectedItems } from "@/providers/SelectedItemsProvider";

// Special function for selecting text (MODAL)

export default function SelectItems() {
  const { colors } = useTheme();
  const [showTextModal, setTextShowModal] = useState<boolean>(false);
  const { selectedItems, addToSelection } = useSelectedItems();
  const handleSelectText = () => {
    console.log("Selecting Text");
    setTextShowModal(true);
  };

  const selectTypeOptions = [
    {
      type: "File",
      icon: "file",
      onPress: handleSelectFile(addToSelection),
    },
    {
      type: "Media",
      icon: "photo",
      onPress: handleSelectMedia(addToSelection),
    },
    {
      type: "Text",
      icon: "pencil",
      onPress: handleSelectText,
    },
    {
      type: "Paste",
      icon: "clipboard",
      onPress: handlePaste(addToSelection),
    },
    {
      type: "Folder",
      icon: "folder",
      onPress: handleSelectFolder(addToSelection),
    },
    {
      type: "App",
      icon: "cubes",
      onPress: handleSelectApp,
    },
  ];
  useEffect(() => {
    console.log("Selected Items:", selectedItems);
  }, [selectedItems]);
  return (
    <View style={{ ...styles.selectContainer, borderColor: colors.border }}>
      {selectTypeOptions.map((item, index) => (
        <SelectTypeCard
          key={index}
          type={item.type}
          icon={item.icon as FontAwesomeIconName}
          onPress={item.onPress}
        />
      ))}
      <TextInputModal
        visible={showTextModal}
        onClose={() => setTextShowModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  selectContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
});
