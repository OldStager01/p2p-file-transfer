import React, { useState, useEffect } from "react";
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
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/providers/AuthProvider";
import Button from "@/components/Button";
import { SPACING, RADIUS, FONTS, SHADOWS } from "@/themes";
import { supabase } from "@/lib/supabase/client";

export default function FileViewer({ transfer, colors, onBack }: any) {
  const { session } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadStatus, setDownloadStatus] = useState<
    Record<
      string,
      {
        downloading: boolean;
        progress: number;
        error?: boolean;
        localPath?: string;
      }
    >
  >({});
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // Fetch files on component mount
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);

        // Fetch files from transfer_files table using transfer.id as foreign key
        const { data, error } = await supabase
          .from("transfer_files")
          .select("*")
          .eq("transfer_id", transfer.id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        setFiles(data || []);
      } catch (error) {
        console.error("Error fetching files:", error);
        Alert.alert(
          "Error Loading Files",
          "Could not load files for this transfer. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [transfer.id]);

  // Request permissions on component mount
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === "ios" || Platform.OS === "android") {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setPermissionsGranted(status === "granted");

        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Storage permission is needed to download files.",
            [{ text: "OK" }]
          );
        }
      } else {
        // Web or other platforms
        setPermissionsGranted(true);
      }
    };

    requestPermissions();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatExpiryDate = (expiryDate: string | null) => {
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

  const getFileIcon = (type: string) => {
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

  const handleDownloadFile = async (file: any) => {
    if (!permissionsGranted) {
      Alert.alert(
        "Permission Denied",
        "Storage permission is needed to download files. Please update permissions in settings.",
        [{ text: "OK" }]
      );
      return;
    }

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Set initial download status
    setDownloadStatus((prev) => ({
      ...prev,
      [file.id]: { downloading: true, progress: 0.05 },
    }));

    try {
      // Get a signed URL for the file with 30 minute expiry
      const { data, error } = await supabase.storage
        .from("transfers")
        .createSignedUrl(file.storage_path, 1800);

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error("Failed to get download URL");
      }

      // Create a sanitized filename (remove special characters)
      const sanitizedName = file.file_name.replace(/[^a-zA-Z0-9\.]/g, "_");
      let finalUri = "";

      if (Platform.OS === "android") {
        // Android implementation
        const tempPath = `${FileSystem.cacheDirectory}${sanitizedName}`;

        // Download with progress tracking
        const downloadResumable = FileSystem.createDownloadResumable(
          data.signedUrl,
          tempPath,
          {
            md5: true,
            headers: { "Content-Type": file.file_type },
          },
          (downloadProgress) => {
            const progress =
              downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite;
            setDownloadStatus((prev) => ({
              ...prev,
              [file.id]: {
                ...prev[file.id],
                progress: Math.max(0.05, progress),
              },
            }));
          }
        );

        // Start the download
        const { uri } = await downloadResumable.downloadAsync();
        finalUri = uri;

        // Handle different file types
        const isMediaFile =
          file.file_type.startsWith("image/") ||
          file.file_type.startsWith("video/") ||
          file.file_type.startsWith("audio/");

        if (isMediaFile) {
          // For media files, save to media library
          try {
            const asset = await MediaLibrary.createAssetAsync(uri);
            finalUri = asset.uri;

            // Try to add to Downloads album
            const albums = await MediaLibrary.getAlbumsAsync();
            const downloadsAlbum = albums.find(
              (album) =>
                album.title === "Download" || album.title === "Downloads"
            );

            if (downloadsAlbum) {
              await MediaLibrary.addAssetsToAlbumAsync(
                [asset],
                downloadsAlbum,
                false
              );
            }
          } catch (mediaError) {
            console.warn("Could not save media to library:", mediaError);
            // Continue with the file in cache
          }
        } else {
          // For non-media files on Android 10+, we need to use SAF
          // This is a simplified version - in production, consider using
          // react-native-blob-util or react-native-fs for direct Downloads folder access

          // For now, we'll keep the file in app cache and offer sharing
          Alert.alert(
            "File Downloaded",
            "This file type can't be saved directly to Downloads. Use the Share option to save it elsewhere.",
            [
              { text: "OK" },
              {
                text: "Share File",
                onPress: async () => {
                  const canShare = await Sharing.isAvailableAsync();
                  if (canShare) {
                    await Sharing.shareAsync(uri, {
                      mimeType: file.file_type,
                      dialogTitle: `Share ${file.file_name}`,
                    });
                  }
                },
              },
            ]
          );
        }
      } else if (Platform.OS === "ios") {
        // iOS - Download to app directory then let user save via Share sheet
        const tempPath = `${FileSystem.documentDirectory}${sanitizedName}`;

        // Download with progress tracking
        const downloadResumable = FileSystem.createDownloadResumable(
          data.signedUrl,
          tempPath,
          {
            md5: true,
            headers: { "Content-Type": file.file_type },
          },
          (downloadProgress) => {
            const progress =
              downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite;
            setDownloadStatus((prev) => ({
              ...prev,
              [file.id]: {
                ...prev[file.id],
                progress: Math.max(0.05, progress),
              },
            }));
          }
        );

        // Start the download
        const { uri } = await downloadResumable.downloadAsync();
        finalUri = uri;

        // Show success notification
        if (Platform.OS === "ios") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Check if it's a media file
        const isMediaFile =
          file.file_type.startsWith("image/") ||
          file.file_type.startsWith("video/") ||
          file.file_type.startsWith("audio/");

        if (isMediaFile) {
          // For media files, offer to save to Photos library
          Alert.alert(
            "Download Complete",
            `${file.file_name} downloaded successfully. Save to Photos?`,
            [
              { text: "No" },
              {
                text: "Save to Photos",
                onPress: async () => {
                  try {
                    await MediaLibrary.saveToLibraryAsync(uri);
                    Alert.alert("Success", "Saved to Photos library");
                  } catch (saveError) {
                    Alert.alert("Error", "Could not save to Photos library");
                  }
                },
              },
              {
                text: "Share File",
                onPress: async () => {
                  const canShare = await Sharing.isAvailableAsync();
                  if (canShare) {
                    await Sharing.shareAsync(uri, {
                      mimeType: file.file_type,
                      dialogTitle: `Save ${file.file_name}`,
                      UTI: file.file_type,
                    });
                  }
                },
              },
            ]
          );
        } else {
          // For non-media files, offer to share/save
          const canShare = await Sharing.isAvailableAsync();

          if (canShare) {
            Alert.alert(
              "Download Complete",
              `${file.file_name} downloaded successfully. Save to Files app?`,
              [
                { text: "Later" },
                {
                  text: "Save to Files",
                  onPress: async () => {
                    await Sharing.shareAsync(uri, {
                      mimeType: file.file_type,
                      dialogTitle: `Save ${file.file_name} to Files app`,
                      UTI: file.file_type,
                    });
                  },
                },
              ]
            );
          }
        }
      } else {
        // Web platform
        window.open(data.signedUrl, "_blank");
        finalUri = data.signedUrl;
      }

      // Record download in Supabase
      if (session) {
        try {
          await supabase.rpc("record_download", {
            p_user_id: session.user.id,
            p_file_id: file.id,
            p_download_path: finalUri,
          });

          // Update local file object
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.id === file.id
                ? { ...f, download_count: (f.download_count || 0) + 1 }
                : f
            )
          );
        } catch (recordError) {
          console.error("Failed to record download:", recordError);
        }
      }

      // Update download status to completed
      setDownloadStatus((prev) => ({
        ...prev,
        [file.id]: {
          downloading: false,
          progress: 1,
          localPath: finalUri,
        },
      }));
    } catch (error) {
      console.error("Download error:", error);
      setDownloadStatus((prev) => ({
        ...prev,
        [file.id]: { downloading: false, progress: 0, error: true },
      }));
      Alert.alert(
        "Download Error",
        `Failed to download file: ${error.message}`
      );
    }
  };

  const handleOpenFile = async (file: any) => {
    const status = downloadStatus[file.id];

    if (status?.progress === 1 && status.localPath) {
      if (Platform.OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      try {
        // Check if file exists
        const fileInfo = await FileSystem.getInfoAsync(status.localPath);
        if (!fileInfo.exists) {
          throw new Error("File does not exist anymore");
        }

        // Check if sharing is available
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(status.localPath, {
            mimeType: file.file_type,
            dialogTitle: `Share ${file.file_name}`,
            UTI: file.file_type, // for iOS
          });
        } else {
          Alert.alert(
            "Sharing not available",
            "Sharing is not supported on this device"
          );
        }
      } catch (error) {
        console.error("Error opening file:", error);
        Alert.alert(
          "Error Opening File",
          "The file could not be opened. It may have been moved or deleted."
        );

        // Reset download status to allow re-downloading
        setDownloadStatus((prev) => ({
          ...prev,
          [file.id]: { downloading: false, progress: 0 },
        }));
      }
    } else {
      handleDownloadFile(file);
    }
  };

  const renderFileItem = ({ item }: any) => {
    const status = downloadStatus[item.id] || {
      downloading: false,
      progress: 0,
    };
    const fileIcon = getFileIcon(item.file_type);

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
              {item.file_name}
            </Text>
            <View style={styles.fileInfoRow}>
              <Text style={[styles.fileSize, { color: colors.text + "70" }]}>
                {formatSize(item.file_size)}
              </Text>
              {item.download_count > 0 && (
                <View style={styles.downloadCountContainer}>
                  <Ionicons
                    name="download-outline"
                    size={12}
                    color={colors.text + "70"}
                  />
                  <Text
                    style={[
                      styles.downloadCount,
                      { color: colors.text + "70" },
                    ]}
                  >
                    {item.download_count}
                  </Text>
                </View>
              )}
            </View>
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
              disabled={!permissionsGranted}
            >
              <Ionicons name="download-outline" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleDownloadAll = async () => {
    if (!permissionsGranted) {
      Alert.alert(
        "Permission Denied",
        "Storage permission is needed to download files. Please update permissions in settings.",
        [{ text: "OK" }]
      );
      return;
    }

    // Check how many files will be downloaded
    const remainingFiles = files.filter(
      (file) =>
        !downloadStatus[file.id]?.downloading &&
        downloadStatus[file.id]?.progress !== 1
    );

    if (remainingFiles.length === 0) {
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        "No Files to Download",
        "All files have already been downloaded."
      );
      return;
    }

    // Confirm before downloading multiple files
    if (remainingFiles.length > 1) {
      Alert.alert(
        "Download Multiple Files",
        `Do you want to download ${remainingFiles.length} files?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Download All",
            onPress: () => startBatchDownload(remainingFiles),
          },
        ]
      );
    } else {
      startBatchDownload(remainingFiles);
    }
  };

  const startBatchDownload = async (filesToDownload) => {
    // Download files sequentially to avoid overwhelming the network
    for (const file of filesToDownload) {
      if (
        !downloadStatus[file.id]?.downloading &&
        downloadStatus[file.id]?.progress !== 1
      ) {
        await handleDownloadFile(file);
        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  };

  // Render loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading files...
        </Text>
      </View>
    );
  }

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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-outline"
              size={48}
              color={colors.text + "40"}
            />
            <Text style={[styles.emptyText, { color: colors.text + "70" }]}>
              No files available in this transfer
            </Text>
          </View>
        }
      />

      {files.length > 0 && (
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
            disabled={!permissionsGranted}
            style={{
              backgroundColor: files.every(
                (f) => downloadStatus[f.id]?.progress === 1
              )
                ? "#43A047"
                : undefined,
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.body,
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
    flexGrow: 1,
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
  fileInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fileName: {
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.medium,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: FONTS.sizes.caption,
  },
  downloadCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: SPACING.sm,
  },
  downloadCount: {
    fontSize: FONTS.sizes.caption,
    marginLeft: 2,
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  emptyText: {
    marginTop: SPACING.md,
    textAlign: "center",
    fontSize: FONTS.sizes.body,
  },
});
