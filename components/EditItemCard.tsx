import { Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useTheme } from "@react-navigation/native";
import { FontAwesomeIconName } from "@/types";
import { useSelectedItems } from "@/providers/SelectedItemsProvider";

export default function EditItemCard({
  name,
  icon,
  id,
}: {
  name: string;
  icon: FontAwesomeIconName;
  id: string;
}) {
  const { colors } = useTheme();
  const { removeFromSelection } = useSelectedItems();
  return (
    <View style={{ ...styles.selectedItem, borderColor: colors.border }}>
      <View style={styles.itemContainer}>
        <FontAwesome
          name={icon}
          size={22}
          style={styles.selectedItemIcon}
          color={colors.text}
        />
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ ...styles.selectedItemText, color: colors.text }}
        >
          {name}
        </Text>
      </View>
      <Pressable style={{ flex: 0.1 }} onPress={() => removeFromSelection(id)}>
        <FontAwesome
          name="close"
          size={24}
          style={styles.selectedItemIcon}
          color={colors.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedItem: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "nowrap",
    gap: 15,
  },
  itemContainer: {
    flexDirection: "row",
    alignContent: "center",
    flex: 1,
    gap: 15,
  },
  selectedItemIcon: {},
  selectedItemText: {
    fontSize: 12,
    overflow: "hidden",
    flexShrink: 1,
    textAlign: "center",
  },
});
