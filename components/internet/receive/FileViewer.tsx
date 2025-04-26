import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import Button from "@/components/Button";
import { SPACING, RADIUS, FONTS, SHADOWS } from "@/themes";

export default function FileViewer({ transfer, colors, onBack }) {
  const [files, setFiles] = useState(transfer.files || []);
  const [downloadStatus, setDownloadStatus] = useState({});

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatExpiryDate = (expiryDate) => {
    if (!expiryDate) return "No expiry";

    const date = new Date(expiryDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Expired";
    if (diffDays === 1) return "Expires today";
    if (diffDays < 7) return `Expires in ${diffDays} days`;
    return `Expires on ${formatDate(expiryDate)}`;
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

  const handleDownloadFile = async (file) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Set initial download status
    setDownloadStatus((prev) => ({
      ...prev,
      [file.id]: { downloading: true, progress: 0 },
    }));

    try {
      // In a real implementation, download from Supabase Storage
      // const fileUrl = await supabase.storage
      //   .from('transfers')
      //   .getPublicUrl(`${transfer.id}/${file.id}`);

      // Simulate download progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.1;
        setDownloadStatus((prev) => ({
          ...prev,
          [file.id]: {
            downloading: progress < 1,
            progress: Math.min(progress, 1),
          },
        }));

        if (progress >= 1) {
          clearInterval(interval);
          if (Platform.OS === "ios") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          Alert.alert(
            "Download Complete",
            `${file.name} downloaded successfully`
          );
        }
      }, 300);
    } catch (error) {
      console.error("Download error:", error);
      setDownloadStatus((prev) => ({
        ...prev,
        [file.id]: { downloading: false, progress: 0, error: true },
      }));
      Alert.alert("Download Error", "Failed to download file");
    }
  };

  const handleOpenFile = (file) => {
    if (downloadStatus[file.id]?.progress === 1) {
      if (Platform.OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // In a real implementation, open the file using appropriate viewers
      Alert.alert("Opening File", `Opening ${file.name}...`);
    } else {
      handleDownloadFile(file);
    }
  };

  const renderFileItem = ({ item }) => {
    const status = downloadStatus[item.id] || {
      downloading: false,
      progress: 0,
    };
    const fileIcon = getFileIcon(item.type);

    return (
      <TouchableOpacity
        style={[styles.fileItem, { backgroundColor: colors.card }]}
        onPress={() => handleOpenFile(item)}
      >
        <View style={styles.fileContent}>
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
              {item.name}
            </Text>
            <Text style={[styles.fileSize, { color: colors.text + "70" }]}>
              {formatSize(item.size)}
            </Text>
          </View>
        </View>

        <View style={styles.downloadSection}>
          {status.downloading ? (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text
                style={[styles.progressText, { color: colors.text + "80" }]}
              >
                {Math.round(status.progress * 100)}%
              </Text>
            </View>
          ) : status.progress === 1 ? (
            <View style={styles.downloadedContainer}>
              <Ionicons name="checkmark-circle" size={22} color="#43A047" />
              <Text style={[styles.downloadedText, { color: "#43A047" }]}>
                Downloaded
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.downloadButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => handleDownloadFile(item)}
            >
              <Ionicons name="download-outline" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleDownloadAll = () => {
    files.forEach((file) => {
      if (
        !downloadStatus[file.id]?.downloading &&
        downloadStatus[file.id]?.progress !== 1
      ) {
        handleDownloadFile(file);
      }
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={[styles.backText, { color: colors.primary }]}>
          Try Another Code
        </Text>
      </TouchableOpacity>

      <View style={[styles.transferHeader, { backgroundColor: colors.card }]}>
        <View style={styles.transferInfo}>
          <Text style={[styles.transferTitle, { color: colors.text }]}>
            {transfer.title || "Shared Files"}
          </Text>

          <View style={styles.transferMetaContainer}>
            <View style={styles.transferMetaItem}>
              <Ionicons
                name="person-outline"
                size={16}
                color={colors.text + "70"}
              />
              <Text
                style={[styles.transferMetaText, { color: colors.text + "70" }]}
              >
                From: {transfer.username || "Anonymous"}
              </Text>
            </View>

            <View style={styles.transferMetaItem}>
              <Ionicons
                name="time-outline"
                size={16}
                color={colors.text + "70"}
              />
              <Text
                style={[styles.transferMetaText, { color: colors.text + "70" }]}
              >
                {formatExpiryDate(transfer.expires_at)}
              </Text>
            </View>

            <View style={styles.transferMetaItem}>
              <Ionicons
                name={
                  transfer.is_public ? "globe-outline" : "lock-closed-outline"
                }
                size={16}
                color={colors.text + "70"}
              />
              <Text
                style={[styles.transferMetaText, { color: colors.text + "70" }]}
              >
                {transfer.is_public ? "Public access" : "Restricted access"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Available Files ({files.length})
      </Text>

      <FlatList
        data={files}
        renderItem={renderFileItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.filesList}
      />

      <View style={styles.buttonContainer}>
        <Button
          text={
            files.every((f) => downloadStatus[f.id]?.progress === 1)
              ? "All Files Downloaded"
              : "Download All Files"
          }
          icon={
            files.every((f) => downloadStatus[f.id]?.progress === 1)
              ? "checkmark-circle"
              : "download-outline"
          }
          onPress={handleDownloadAll}
          style={{
            backgroundColor: files.every(
              (f) => downloadStatus[f.id]?.progress === 1
            )
              ? "#43A047"
              : null,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  backText: {
    marginLeft: 5,
    fontSize: FONTS.sizes.body,
  },
  transferHeader: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  transferInfo: {
    flex: 1,
  },
  transferTitle: {
    fontSize: FONTS.sizes.title,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.xs,
  },
  transferMetaContainer: {
    marginTop: SPACING.xs,
  },
  transferMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  transferMetaText: {
    marginLeft: 5,
    fontSize: FONTS.sizes.caption,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.semiBold,
    marginVertical: SPACING.sm,
  },
  filesList: {
    paddingBottom: SPACING.lg,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  fileContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  fileSize: {
    fontSize: FONTS.sizes.caption,
  },
  downloadSection: {
    minWidth: 80,
    alignItems: "flex-end",
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressText: {
    marginLeft: 5,
    fontSize: FONTS.sizes.caption,
  },
  downloadedContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  downloadedText: {
    marginLeft: 5,
    fontSize: FONTS.sizes.caption,
  },
  buttonContainer: {
    padding: SPACING.md,
  },
});
