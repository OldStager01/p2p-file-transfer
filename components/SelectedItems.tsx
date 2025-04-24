import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Platform,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { useSelectedItems } from "@/providers/SelectedItemsProvider";
import { SelectedItemType, ItemType } from "@/types";
import EditModal from "./EditModal";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "@/themes";

// Individual selected item card component
const SelectedItemCard = ({ item, index }: { item: any; index: number }) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  // Get icon based on item type
  let iconName = "help-circle-outline";
  let iconColor = COLORS.primary;

  switch (item.type) {
    case ItemType.File:
      iconName = "document-outline";
      iconColor = "#4A6DF0"; // blue
      break;
    case ItemType.Media:
      iconName = "image-outline";
      iconColor = "#F44771"; // pink
      break;
    case ItemType.Text:
      iconName = "create-outline";
      iconColor = "#5E35B1"; // purple
      break;
    case ItemType.Folder:
      iconName = "folder-outline";
      iconColor = "#FB8C00"; // orange
      break;
    default:
      break;
  }

  // Format size
  const formatSize = (size) => {
    if (!size) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileName = item.data?.name || "Unnamed";
  const fileSize = item.data?.size ? formatSize(item.data.size) : "";

  return (
    <Animated.View
      style={[
        styles.itemCard,
        {
          backgroundColor: colors.card,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View
        style={[styles.iconContainer, { backgroundColor: iconColor + "15" }]}
      >
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <View style={styles.itemDetails}>
        <Text
          style={[styles.itemName, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {fileName}
        </Text>
        {fileSize && (
          <Text style={[styles.itemSize, { color: colors.text + "80" }]}>
            {fileSize}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

export default function SelectedItems() {
  const { colors } = useTheme();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const { selectedItems, clearSelection } = useSelectedItems();

  const handleEditPress = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setEditModalVisible(true);
  };

  const handleClearAll = () => {
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    clearSelection();
  };

  if (selectedItems.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
        <View style={styles.emptyContent}>
          <Ionicons
            name="albums-outline"
            size={40}
            color={colors.primary}
            style={{ opacity: 0.5 }}
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No items selected
          </Text>
          <Text style={[styles.emptySubText, { color: colors.text + "80" }]}>
            Select files, photos or text to share
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Ready to Send
          </Text>
          <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
            {selectedItems.length}{" "}
            {selectedItems.length === 1 ? "item" : "items"} selected
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.border }]}
            onPress={handleClearAll}
          >
            <Ionicons name="trash-outline" size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleEditPress}
          >
            <Ionicons name="pencil-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={selectedItems}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.itemsListContent}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <SelectedItemCard item={item} index={index} />
        )}
      />

      <EditModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    overflow: "hidden",
    ...SHADOWS.small,
  },
  emptyContainer: {
    borderRadius: RADIUS.md,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  emptyContent: {
    alignItems: "center",
    padding: SPACING.lg,
  },
  emptyText: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.medium,
    marginTop: SPACING.sm,
  },
  emptySubText: {
    fontSize: FONTS.sizes.caption,
    marginTop: SPACING.xs,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.1)",
  },
  title: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.semiBold,
  },
  subtitle: {
    fontSize: FONTS.sizes.caption,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  itemsListContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  itemCard: {
    width: 120,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  itemDetails: {
    width: "100%",
    alignItems: "center",
  },
  itemName: {
    fontSize: FONTS.sizes.caption,
    fontWeight: FONTS.weights.medium,
    textAlign: "center",
    width: "100%",
  },
  itemSize: {
    fontSize: FONTS.sizes.caption,
    marginTop: 2,
  },
});
