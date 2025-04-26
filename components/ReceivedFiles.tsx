import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "@/themes";

// Mock data for received files
const mockReceivedFiles = [
  {
    id: "1",
    name: "Project_Report.pdf",
    size: 2456789,
    type: "file",
    receivedAt: "2025-04-24T18:30:00Z",
    path: "/documents/Project_Report.pdf",
  },
  {
    id: "2",
    name: "Vacation_Photo.jpg",
    size: 1234567,
    type: "image",
    receivedAt: "2025-04-24T18:25:00Z",
    path: "/images/Vacation_Photo.jpg",
  },
  {
    id: "3",
    name: "Meeting_Notes.txt",
    size: 3456,
    type: "text",
    receivedAt: "2025-04-24T18:20:00Z",
    path: "/documents/Meeting_Notes.txt",
  },
];

export default function ReceivedFilesList() {
  const { colors } = useTheme();
  const [files, setFiles] = useState(mockReceivedFiles);

  // Format file size
  const formatSize = (size) => {
    if (!size) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleOpenFile = (file) => {
    // In a real implementation, this would use FileSystem.openAsync or a similar method
    // to open the file with the appropriate viewer
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert("Opening file", `Opening ${file.name}...`);
  };

  const handleShareFile = async (file) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      // In a real implementation, check if file exists and share it
      // const isAvailable = await Sharing.isAvailableAsync();
      // if (isAvailable) {
      //   await Sharing.shareAsync(file.path);
      // }
      Alert.alert("Sharing", `Sharing ${file.name}...`);
    } catch (error) {
      Alert.alert("Error", "Failed to share file");
    }
  };

  const handleDeleteFile = (fileId) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert("Delete File", "Are you sure you want to delete this file?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          // In a real implementation, delete the file from storage
          setFiles(files.filter((file) => file.id !== fileId));
        },
      },
    ]);
  };

  const renderFileItem = ({ item }) => {
    // Get appropriate icon based on file type
    let iconName = "document-outline";
    let iconColor = "#4A6DF0"; // blue default

    switch (item.type) {
      case "image":
        iconName = "image-outline";
        iconColor = "#F44771"; // pink
        break;
      case "text":
        iconName = "create-outline";
        iconColor = "#5E35B1"; // purple
        break;
      case "folder":
        iconName = "folder-outline";
        iconColor = "#FB8C00"; // orange
        break;
      default:
        break;
    }

    return (
      <View style={[styles.fileItem, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.fileContent}
          onPress={() => handleOpenFile(item)}
        >
          <View
            style={[
              styles.fileIconContainer,
              { backgroundColor: iconColor + "15" },
            ]}
          >
            <Ionicons name={iconName} size={24} color={iconColor} />
          </View>

          <View style={styles.fileDetails}>
            <Text
              style={[styles.fileName, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View style={styles.fileMetadata}>
              <Text style={[styles.fileSize, { color: colors.text + "80" }]}>
                {formatSize(item.size)}
              </Text>
              <Text style={[styles.fileTime, { color: colors.text + "80" }]}>
                {formatDate(item.receivedAt)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.fileActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.primary + "20" },
            ]}
            onPress={() => handleShareFile(item)}
          >
            <Ionicons name="share-outline" size={18} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#F4477120" }]}
            onPress={() => handleDeleteFile(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#F44771" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (files.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
        <Ionicons
          name="document-outline"
          size={40}
          color={colors.primary}
          style={{ opacity: 0.5 }}
        />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No received files
        </Text>
        <Text style={[styles.emptySubText, { color: colors.text + "80" }]}>
          Files you receive will appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={files}
        renderItem={renderFileItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
  },
  emptyContainer: {
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
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
  fileItem: {
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  fileContent: {
    flexDirection: "row",
    padding: SPACING.md,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  fileDetails: {
    flex: 1,
    justifyContent: "center",
  },
  fileName: {
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.medium,
  },
  fileMetadata: {
    flexDirection: "row",
    marginTop: 4,
  },
  fileSize: {
    fontSize: FONTS.sizes.caption,
    marginRight: SPACING.md,
  },
  fileTime: {
    fontSize: FONTS.sizes.caption,
  },
  fileActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 150, 150, 0.1)",
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
