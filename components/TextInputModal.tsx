import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import React, { useState } from "react";
import { useTheme } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { handleTextInput } from "@/utils/handlers";
import { useSelectedItems } from "@/providers/SelectedItemsProvider";
export default function TextInputModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState<string>("");
  const { colors } = useTheme();
  const { addToSelection } = useSelectedItems();
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
            Enter Text
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline={true}
            numberOfLines={15}
            textAlignVertical="top"
            style={{
              ...styles.input,
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border,
            }}
            placeholder="Enter text to send"
            placeholderTextColor={"gray"}
          />
          <View style={{ ...styles.buttonContainer }}>
            <Pressable
              style={{
                ...styles.button,
                backgroundColor: colors.text,
              }}
              onPress={() => {
                handleTextInput(text, addToSelection);
                setText("");
                onClose();
              }}
            >
              <FontAwesome name="check" size={20} color={colors.background} />
              <Text style={{ color: colors.background }}>Submit</Text>
            </Pressable>
            <Pressable
              style={{
                ...styles.button,
                backgroundColor: "red",
              }}
              onPress={onClose}
            >
              <FontAwesome name="check" size={20} color={"white"} />
              <Text style={{ color: "white" }}>Close</Text>
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
    gap: 10,
  },
  button: {
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
