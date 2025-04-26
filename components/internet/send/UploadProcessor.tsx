/**
 * Component for processing uploads from selected items
 * Created: 2025-04-26 00:04:03
 * Author: OldStager01
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelectedItems } from "@/providers/SelectedItemsProvider";
import { useFileUpload } from "@/hooks/useFileUpload";
import { createTransfer } from "@/lib/supabase/transfers";
import { SelectedItemType, ItemType } from "../../../types";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../../themes";

interface UploadProcessorProps {
  transferData: {
    title: string;
    description?: string;
    isPublic: boolean;
    expiryDate?: Date | null;
    emails?: string[];
  };
  onComplete: (result: {
    success: boolean;
    transferId: string;
    connectionCode: string;
    error?: string;
  }) => void;
  onCancel: () => void;
}

export default function UploadProcessor({
  transferData,
  onComplete,
  onCancel,
}: UploadProcessorProps) {
  const { selectedItems } = useSelectedItems();
  const { uploadSelectedItems, uploading, progress, error } = useFileUpload();
  const [transfer, setTransfer] = useState<any>(null);
  const [stage, setStage] = useState<
    "creating" | "uploading" | "finishing" | "error" | "complete"
  >("creating");
  const [overallProgress, setOverallProgress] = useState(0);

  // Filter only file and media items
  const uploadableItems = selectedItems.filter((item) =>
    [ItemType.File, ItemType.Media].includes(item.type)
  );

  // Calculate overall progress
  useEffect(() => {
    if (Object.keys(progress).length === 0) return;

    const total = Object.values(progress).reduce(
      (sum, item) => sum + item.progress,
      0
    );
    const avgProgress = total / Object.keys(progress).length;
    setOverallProgress(avgProgress);
  }, [progress]);

  // Start upload process
  useEffect(() => {
    const processUpload = async () => {
      try {
        // Step 1: Create transfer record
        setStage("creating");
        const { data, error: createError } = await createTransfer(transferData);

        if (createError || !data) {
          throw createError || new Error("Failed to create transfer");
        }

        setTransfer(data);

        // Step 2: Upload files
        setStage("uploading");
        const {
          data: files,
          error: uploadError,
          failures,
        } = await uploadSelectedItems(data.id, uploadableItems);

        if (uploadError) {
          throw uploadError;
        }

        // Step 3: Complete
        setStage("finishing");
        setTimeout(() => {
          setStage("complete");
          onComplete({
            success: true,
            transferId: data.id,
            connectionCode: data.connectionCode,
            error:
              failures > 0 ? `${failures} files failed to upload` : undefined,
          });
        }, 1000);
      } catch (err) {
        console.error("Upload process error:", err);
        setStage("error");
      }
    };

    processUpload();
  }, []);

  if (stage === "error") {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#F44771" />
          <Text style={styles.errorTitle}>Upload Failed</Text>
          <Text style={styles.errorMessage}>
            {error?.message || "An unexpected error occurred"}
          </Text>
          <TouchableOpacity style={styles.tryAgainButton} onPress={onCancel}>
            <Text style={styles.tryAgainText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.title}>Uploading Files</Text>

        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${Math.round(overallProgress * 100)}%` },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          {Math.round(overallProgress * 100)}% Complete
        </Text>

        <Text style={styles.statusText}>
          {stage === "creating" && "Creating transfer..."}
          {stage === "uploading" && "Uploading files..."}
          {stage === "finishing" && "Finalizing transfer..."}
          {stage === "complete" && "Upload complete!"}
        </Text>
      </View>

      <ScrollView style={styles.itemsContainer}>
        {uploadableItems.map((item) => {
          const itemId = item.id || item.data.name;
          const itemProgress = progress[itemId] || {
            progress: 0,
            status: "pending",
          };

          return (
            <View key={itemId} style={styles.itemRow}>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {item.data.name}
                </Text>
                <Text style={styles.fileSize}>
                  {formatFileSize(item.data.size)}
                </Text>
              </View>

              <View style={styles.statusIndicator}>
                {itemProgress.status === "pending" && (
                  <ActivityIndicator size="small" color="#6E6E6E" />
                )}
                {itemProgress.status === "uploading" && (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                )}
                {itemProgress.status === "processing" && (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                )}
                {itemProgress.status === "completed" && (
                  <Ionicons name="checkmark-circle" size={20} color="#43A047" />
                )}
                {itemProgress.status === "error" && (
                  <Ionicons name="alert-circle" size={20} color="#F44771" />
                )}

                <Text
                  style={[
                    styles.statusText,
                    itemProgress.status === "completed" &&
                      styles.statusCompleted,
                    itemProgress.status === "error" && styles.statusError,
                  ]}
                >
                  {itemProgress.status === "pending" && "Pending"}
                  {itemProgress.status === "uploading" && "Uploading"}
                  {itemProgress.status === "processing" && "Processing"}
                  {itemProgress.status === "completed" && "Complete"}
                  {itemProgress.status === "error" && "Failed"}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {stage !== "complete" && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.title,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.md,
  },
  progressBarContainer: {
    height: 10,
    width: "100%",
    backgroundColor: "#EEEEEE",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: SPACING.xs,
  },
  progressBar: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: FONTS.sizes.body,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
    marginBottom: SPACING.sm,
  },
  statusText: {
    fontSize: FONTS.sizes.caption,
    color: "#6E6E6E",
  },
  itemsContainer: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  fileInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  fileName: {
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.medium,
  },
  fileSize: {
    fontSize: FONTS.sizes.caption,
    color: "#6E6E6E",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusCompleted: {
    color: "#43A047",
  },
  statusError: {
    color: "#F44771",
  },
  cancelButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: "#EEEEEE",
    alignSelf: "center",
  },
  cancelText: {
    fontSize: FONTS.sizes.body,
    color: "#6E6E6E",
    fontWeight: FONTS.weights.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  errorTitle: {
    fontSize: FONTS.sizes.title,
    fontWeight: FONTS.weights.bold,
    color: "#F44771",
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: FONTS.sizes.body,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  tryAgainButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  tryAgainText: {
    color: "white",
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.medium,
  },
});
