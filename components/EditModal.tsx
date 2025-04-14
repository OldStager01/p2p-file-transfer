import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Modal,
  Pressable,
  FlatList,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useTheme } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  SelectedItemType,
  useSelectedItems,
} from "@/providers/SelectedItemsProvider";
import EditItemCard from "./EditItemCard";
import { FontAwesomeIconName, ItemType } from "@/types";
export default function EditModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [items, setItems] = useState<
    { icon: FontAwesomeIconName; name: string; id: string | undefined }[]
  >([]);

  const { selectedItems, clearSelection } = useSelectedItems();
  useEffect(() => {
    const newItems = selectedItems.map((item: SelectedItemType) => {
      let icon: FontAwesomeIconName = "question";
      let name = "Unknown";

      if (item.type === ItemType.File) {
        icon = "file";
        name = item.data.name;
      } else if (item.type === ItemType.Media) {
        icon = "photo";
        name = item.data.fileName;
      } else if (item.type === ItemType.Text) {
        icon = "pencil";
        name = "Text";
      }
      return {
        icon,
        name,
        id: item.id,
      };
    });
    setItems(newItems);

    if (newItems.length === 0 && visible) {
      onClose();
    }
  }, [selectedItems]);
  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View
          style={{
            ...styles.modalContainer,
            borderColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <Text style={{ ...styles.label, color: colors.text }}>
            Edit Selected Items
          </Text>
          <FlatList
            data={items}
            renderItem={({ item }) => (
              <EditItemCard
                name={item.name}
                icon={item.icon}
                id={item.id as string}
              />
            )}
          />
          <View style={{ ...styles.buttonContainer }}>
            <Pressable
              style={{
                ...styles.button,
                backgroundColor: "red",
              }}
              onPress={() => {
                clearSelection();
                onClose();
              }}
            >
              <FontAwesome name="eraser" size={20} color={"white"} />
              <Text style={{ color: "white" }}>Clear All</Text>
            </Pressable>
            <Pressable
              style={{
                ...styles.button,
                backgroundColor: colors.text,
              }}
              onPress={onClose}
            >
              <FontAwesome name="check" size={20} color={colors.background} />
              <Text style={{ color: colors.background }}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00000088",
  },
  modalContainer: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 20,
    width: "80%",
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    marginLeft: 5,
  },
  input: {
    minHeight: 150,
    borderWidth: 2,
    borderRadius: 5,
    padding: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 10,
  },
  button: {
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginTop: 15,
    gap: 5,
    flexDirection: "row",
  },
});
