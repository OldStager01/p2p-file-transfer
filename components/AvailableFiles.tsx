import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "@/themes";

// Mock data for demonstration purposes
const mockAvailableFiles = [
  {
    id: "1",
    name: "Project_Report.pdf",
    size: 2456789,
    type: "file",
    status: "available", // available, downloading, downloaded
  },
  {
    id: "2",
    name: "Vacation_Photo.jpg",
    size: 1234567,
    type: "image",
    status: "available",
  },
  {
    id: "3",
    name: "Meeting_Notes.txt",
    size: 3456,
    type: "text",
    status: "available",
  },
];

const FileItem = ({ item, onDownload }) => {
  const { colors } = useTheme();
  const [downloadStatus, setDownloadStatus] = useState(item.status);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Format file size
  const formatSize = (size) => {
    if (!size) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

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

  const handleDownloadPress = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Start download simulation
    setDownloadStatus("downloading");
    setDownloadProgress(0);

    // Simulate download progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.1;
      setDownloadProgress(Math.min(progress, 1));

      if (progress >= 1) {
        clearInterval(interval);
        setDownloadStatus("downloaded");
        onDownload(item.id);
      }
    }, 300);
  };

  const renderDownloadButton = () => {
    if (downloadStatus === "available") {
      return (
        <TouchableOpacity
          style={[styles.downloadButton, { backgroundColor: colors.primary }]}
          onPress={handleDownloadPress}
        >
          <Ionicons name="download-outline" size={20} color="#fff" />
        </TouchableOpacity>
      );
    } else if (downloadStatus === "downloading") {
      return (
        <View style={styles.downloadProgressContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.progressText, { color: colors.text }]}>
            {Math.round(downloadProgress * 100)}%
          </Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.downloadedIcon, { backgroundColor: "#43A04730" }]}>
          <Ionicons name="checkmark" size={16} color="#43A047" />
        </View>
      );
    }
  };

  return (
    <View style={[styles.fileItem, { backgroundColor: colors.card }]}>
      <View
        style={[
          styles.fileIconContainer,
          { backgroundColor: iconColor + "15" },
        ]}
      >
        <Ionicons name={iconName as any} size={24} color={iconColor} />
      </View>

      <View style={styles.fileDetails}>
        <Text
          style={[styles.fileName, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={[styles.fileSize, { color: colors.text + "80" }]}>
          {formatSize(item.size)}
        </Text>
      </View>

      {renderDownloadButton()}
    </View>
  );
};

export default function AvailableFiles() {
  const { colors } = useTheme();
  const [files, setFiles] = useState(mockAvailableFiles);
  const [loading, setLoading] = useState(false);

  const handleDownload = (fileId) => {
    // In a real implementation, this would handle the actual file saving logic
    console.log(`File with ID ${fileId} downloaded`);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading available files...
        </Text>
      </View>
    );
  }

  if (files.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
        <Ionicons
          name="cloud-offline-outline"
          size={40}
          color={colors.primary}
          style={{ opacity: 0.5 }}
        />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No files available
        </Text>
        <Text style={[styles.emptySubText, { color: colors.text + "80" }]}>
          Wait for the sender to share files
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FileItem item={item} onDownload={handleDownload} />
        )}
        contentContainerStyle={styles.filesList}
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
  loadingContainer: {
    height: 150,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.small,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.body,
  },
  emptyContainer: {
    height: 150,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
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
  filesList: {
    padding: SPACING.md,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    ...SHADOWS.small,
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
  },
  fileName: {
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.medium,
  },
  fileSize: {
    fontSize: FONTS.sizes.caption,
    marginTop: 2,
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
  },
  downloadProgressContainer: {
    alignItems: "center",
    width: 50,
  },
  progressText: {
    fontSize: FONTS.sizes.caption,
    marginTop: 2,
  },
  downloadedIcon: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
  },
});
