import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import {
  handlePaste,
  handleSelectApp,
  handleSelectFile,
  handleSelectFolder,
  handleSelectMedia,
} from "@/utils/handlers";
import TextInputModal from "./TextInputModal";
import { useSelectedItems } from "@/providers/SelectedItemsProvider";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "@/themes";

type SelectOptionType = {
  type: string;
  icon: string;
  color: string;
  onPress: () => void;
};

const SelectOption = ({
  option,
  onPress,
}: {
  option: SelectOptionType;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    setPressed(true);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setPressed(false));

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={animatePress}
      style={styles.optionTouchable}
    >
      <Animated.View
        style={[
          styles.optionContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            transform: [{ scale: scaleAnim }],
            ...SHADOWS.small,
          },
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: option.color + "15" },
          ]}
        >
          <Ionicons name={option.icon as any} size={24} color={option.color} />
        </View>
        <Text style={[styles.optionText, { color: colors.text }]}>
          {option.type}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function SelectItems() {
  const { colors } = useTheme();
  const [showTextModal, setTextShowModal] = useState<boolean>(false);
  const { selectedItems, addToSelection } = useSelectedItems();

  const handleSelectText = () => {
    setTextShowModal(true);
  };

  const selectTypeOptions = [
    {
      type: "Files",
      icon: "document-outline",
      color: "#4A6DF0", // blue
      onPress: handleSelectFile(addToSelection),
    },
    {
      type: "Media",
      icon: "image-outline",
      color: "#F44771", // pink
      onPress: handleSelectMedia(addToSelection),
    },
    // {
    //   type: "Text",
    //   icon: "create-outline",
    //   color: "#5E35B1", // purple
    //   onPress: handleSelectText,
    // },
    // {
    //   type: "Clipboard",
    //   icon: "clipboard-outline",
    //   color: "#43A047", // green
    //   onPress: handlePaste(addToSelection),
    // },
    {
      type: "Folder",
      icon: "folder-outline",
      color: "#FB8C00", // orange
      onPress: handleSelectFolder(addToSelection),
    },
    // {
    //   type: "Apps",
    //   icon: "apps-outline",
    //   color: "#26C6DA", // teal
    //   onPress: handleSelectApp,
    // },
  ];

  return (
    <View style={[styles.selectContainer, { backgroundColor: colors.card }]}>
      <View style={styles.optionsGrid}>
        {selectTypeOptions.map((option, index) => (
          <SelectOption key={index} option={option} onPress={option.onPress} />
        ))}
      </View>

      <TextInputModal
        visible={showTextModal}
        onClose={() => setTextShowModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  selectContainer: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  optionTouchable: {
    width: "30%",
    marginBottom: SPACING.md,
  },
  optionContainer: {
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  optionText: {
    fontSize: FONTS.sizes.caption,
    marginTop: SPACING.xs,
    fontWeight: FONTS.weights.medium,
  },
});
