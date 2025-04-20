import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useTheme } from "@react-navigation/native";
import SeletedItemCard from "./SelectedItemCard";
import { useSelectedItems } from "@/providers/SelectedItemsProvider";
import { SelectedItemType } from "@/types";
import { FontAwesomeIconName, ItemType } from "@/types";
import EditModal from "./EditModal";

export default function SelectedItems() {
  const { colors } = useTheme();
  const [items, setItems] = useState<
    { icon: FontAwesomeIconName; name: string }[]
  >([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const { selectedItems } = useSelectedItems();
  useEffect(() => {
    const newItems = selectedItems.map((item: SelectedItemType) => {
      let icon: FontAwesomeIconName = "question";
      let name = "Unknown";
      if (item.type === ItemType.File) {
        icon = "file";
        name = item.data.name;
      } else if (item.type === ItemType.Media) {
        icon = "photo";
        name = item.data.name;
      } else if (item.type === ItemType.Text) {
        icon = "pencil";
        name = "Text";
      } else if (item.type === ItemType.Folder) {
        icon = "folder";
        name = "Folder";
      }
      return {
        icon,
        name,
      };
    });
    setItems(newItems);
  }, [selectedItems]);
  return (
    <View style={{ ...styles.container, borderColor: colors.border }}>
      {items.length === 0 ? (
        <Text style={{ color: colors.text, textAlign: "center" }}>
          No Items Selected
        </Text>
      ) : (
        <>
          <FlatList
            data={items}
            horizontal
            contentContainerStyle={styles.selectedContainer}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <SeletedItemCard icon={item.icon} name={item.name} />
            )}
            showsHorizontalScrollIndicator={false}
          />
          <Pressable
            style={{
              ...styles.editButton,
              backgroundColor: colors.text,
            }}
            onPress={() => {
              setEditModalVisible(true);
            }}
          >
            <FontAwesome name="edit" size={20} color={colors.background} />
            <Text style={{ color: colors.background }}>Edit</Text>
          </Pressable>
          <EditModal
            visible={editModalVisible}
            onClose={() => {
              setEditModalVisible(false);
            }}
          />
        </>
      )}
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
