import { StyleSheet, Text, View } from "react-native";
import React from "react";
import SelectTypeCard from "./SelectTypeCard";
import { useTheme } from "@react-navigation/native";
import { FontAwesomeIconName } from "@/types";

const selectTypeOptions = [
  {
    type: "File",
    icon: "file",
    onPress: () => {},
  },
  {
    type: "Media",
    icon: "photo",
    onPress: () => {},
  },
  {
    type: "Text",
    icon: "pencil",
    onPress: () => {},
  },
  {
    type: "Paste",
    icon: "clipboard",
    onPress: () => {},
  },
  {
    type: "Folder",
    icon: "folder",
    onPress: () => {},
  },
  {
    type: "App",
    icon: "cubes",
    onPress: () => {},
  },
];

export default function SelectItems() {
  const { colors } = useTheme();

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
