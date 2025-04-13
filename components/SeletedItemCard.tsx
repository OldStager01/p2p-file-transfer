import { StyleSheet, Text, View } from "react-native";
import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useTheme } from "@react-navigation/native";
import { FontAwesomeIconName } from "@/types";

export default function SeletedItemCard({
  name,
  icon,
}: {
  name: string;
  icon: FontAwesomeIconName;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ ...styles.selectedItem, borderColor: colors.border }}>
      <FontAwesome
        name={icon}
        size={22}
        style={styles.selectedItemIcon}
        color={"#90EE90"}
      />
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{ ...styles.selectedItemText, color: colors.text }}
      >
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedItem: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
    maxWidth: 100,
    gap: 5,
  },
  selectedItemIcon: {},
  selectedItemText: {
    fontSize: 12,
    overflow: "hidden",
    flexShrink: 1,
    textAlign: "center",
  },
});
