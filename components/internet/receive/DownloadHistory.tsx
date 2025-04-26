import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SPACING, RADIUS, FONTS, SHADOWS } from "@/themes";

// Sample download history data
const SAMPLE_DOWNLOADS = [
  {
    id: "1",
    fileName: "Project_Report.pdf",
    fileType: "application/pdf",
    fileSize: 2456789,
    downloadDate: "2025-04-24T12:45:00Z",
    transferTitle: "Project Documents",
    transferCode: "123456",
    filePath: "/documents/Project_Report.pdf",
  },
  {
    id: "2",
    fileName: "Vacation_Photo.jpg",
    fileType: "image/jpeg",
    fileSize: 1234567,
    downloadDate: "2025-04-23T18:30:00Z",
    transferTitle: "Vacation Photos",
    transferCode: "789012",
    filePath: "/images/Vacation_Photo.jpg",
  },
  {
    id: "3",
    fileName: "Meeting_Notes.txt",
    fileType: "text/plain",
    fileSize: 3456,
    downloadDate: "2025-04-22T09:15:00Z",
    transferTitle: "Meeting Materials",
    transferCode: "345678",
    filePath: "/documents/Meeting_Notes.txt",
  },
];

export default function DownloadHistory({ colors }) {
  const [downloads, setDownloads] = useState(SAMPLE_DOWNLOADS);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type) => {
    if (type.includes("image"))
      return { name: "image-outline", color: "#F44771" };
    if (type.includes("pdf"))
      return { name: "document-text-outline", color: "#F44771" };
    if (type.includes("spreadsheet") || type.includes("excel"))
      return { name: "grid-outline", color: "#43A047" };
    if (type.includes("presentation") || type.includes("powerpoint"))
      return { name: "easel-outline", color: "#FB8C00" };
    if (type.includes("text"))
      return { name: "create-outline", color: "#5E35B1" };
    if (type.includes("zip") || type.includes("compressed"))
      return { name: "archive-outline", color: "#795548" };
    return { name: "document-outline", color: "#4A6DF0" };
  };

  const handleOpenFile = (file) => {
    // In a real implementation, check if file exists and open it
    Alert.alert("Open File", `Opening ${file.fileName}...`);
  };

  const handleDeleteFile = (fileId) => {
    Alert.alert(
      "Delete File",
      "Are you sure you want to delete this file from your downloads?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => setDownloads(downloads.filter((d) => d.id !== fileId)),
        },
      ]
    );
  };

  const renderDownloadItem = ({ item }) => {
    const fileIcon = getFileIcon(item.fileType);

    return (
      <View style={[styles.downloadItem, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.fileContent}
          onPress={() => handleOpenFile(item)}
        >
          <View
            style={[
              styles.fileIconContainer,
              { backgroundColor: fileIcon.color + "15" },
            ]}
          >
            <Ionicons name={fileIcon.name} size={24} color={fileIcon.color} />
          </View>

          <View style={styles.fileDetails}>
            <Text
              style={[styles.fileName, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.fileName}
            </Text>
            <Text style={[styles.fileInfo, { color: colors.text + "70" }]}>
              {formatSize(item.fileSize)} • {formatDate(item.downloadDate)}
            </Text>
            <Text style={[styles.transferInfo, { color: colors.text + "70" }]}>
              From: {item.transferTitle} ({item.transferCode})
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#F4477120" }]}
            onPress={() => handleDeleteFile(item.id)}
          >
            <Ionicons name="trash-outline" size={22} color="#F44771" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (downloads.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
        <Ionicons
          name="download-outline"
          size={60}
          color={colors.primary}
          style={{ opacity: 0.5 }}
        />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No Downloads Yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.text + "70" }]}>
          When you download files, they'll appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Your Downloads
      </Text>

      <FlatList
        data={downloads}
        renderItem={renderDownloadItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.downloadsList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.semiBold,
    marginVertical: SPACING.sm,
  },
  downloadsList: {
    paddingBottom: SPACING.lg,
  },
  downloadItem: {
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
    overflow: "hidden",
  },
  fileContent: {
    flexDirection: "row",
    padding: SPACING.md,
  },
  fileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.sm,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.medium,
    marginBottom: 2,
  },
  fileInfo: {
    fontSize: FONTS.sizes.caption,
    marginBottom: 2,
  },
  transferInfo: {
    fontSize: FONTS.sizes.caption,
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 150, 150, 0.1)",
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: "center",
  },
  emptyContainer: {
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.medium,
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.body,
    textAlign: "center",
    marginTop: SPACING.xs,
  },
});
