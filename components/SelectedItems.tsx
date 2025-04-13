import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useTheme } from "@react-navigation/native";
import SeletedItemCard from "./SeletedItemCard";

export default function SelectedItems() {
  const { colors } = useTheme();
  return (
    <View style={{ ...styles.container, borderColor: colors.border }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 5 }}
        style={styles.selectedContainer}
      >
        <SeletedItemCard name="Landscapejpg" icon="photo" />
        <SeletedItemCard name="Landscapejpg" icon="pencil" />
        <SeletedItemCard name="Landscapejpg" icon="pencil" />
        <SeletedItemCard name="Landscapejpg" icon="pencil" />
        <SeletedItemCard name="Landscapejpg" icon="pencil" />
        <SeletedItemCard name="Landscapejpg" icon="pencil" />
        <SeletedItemCard name="Landscapejpg" icon="pencil" />
      </ScrollView>
      <Pressable
        style={{
          ...styles.editButton,
          backgroundColor: colors.text,
        }}
      >
        <FontAwesome name="edit" size={20} color={colors.background} />
        <Text style={{ color: colors.background }}>Edit</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
  },
  selectedContainer: {
    flexDirection: "row",
    gap: 10,
    overflow: "scroll",
  },
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
  editButton: {
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 90,
    alignSelf: "flex-end",
    marginTop: 15,
    marginRight: 10,
    gap: 5,
    flexDirection: "row",
  },
});
