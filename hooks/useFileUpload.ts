/**
 * Custom hook for file uploads with progress tracking
 * Created: 2025-04-26 00:04:03
 * Updated: 2025-04-26 03:31:36
 * Author: OldStager01
 */

import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase/client";
import { SelectedItemType, ItemType } from "../types";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

interface UploadProgress {
  [key: string]: {
    progress: number;
    status: "pending" | "uploading" | "processing" | "completed" | "error";
    error?: string;
  };
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({});
  const [error, setError] = useState<Error | null>(null);

  const uploadSelectedItems = useCallback(
    async (transferId: string, selectedItems: SelectedItemType[]) => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        setUploading(true);
        setError(null);

        // Initialize progress for all files
        const initialProgress: UploadProgress = {};
        selectedItems.forEach((item) => {
          if ([ItemType.File, ItemType.Media].includes(item.type)) {
            initialProgress[item.id || item.data.name] = {
              progress: 0,
              status: "pending",
            };
          }
        });

        setProgress(initialProgress);

        // Verify transfer belongs to user
        const { data: transfer, error: transferError } = await supabase
          .from("transfers")
          .select("id, user_id")
          .eq("id", transferId)
          .eq("user_id", user.id)
          .single();

        if (transferError || !transfer) {
          throw new Error("Transfer not found or you do not have permission");
        }

        const uploadedFiles: any = [];

        // Process files one by one
        for (const item of selectedItems) {
          // Only process files and media
          if (![ItemType.File, ItemType.Media].includes(item.type)) {
            continue;
          }

          const itemId = item.id || item.data.name;
          const { name, uri, size, mimeType } = item.data;

          try {
            // Update status to uploading
            setProgress((prev) => ({
              ...prev,
              [itemId]: { ...prev[itemId], status: "uploading", progress: 0.1 },
            }));

            // Generate unique storage path
            const filePath = `${
              user.id
            }/${transferId}/${Date.now()}_${name.replace(/\s+/g, "_")}`;

            // CRITICAL FIX: Need to read file in binary chunks for React Native
            // Simulate progress while reading and processing
            let currentProgress = 0.1;
            const progressInterval = setInterval(() => {
              if (currentProgress < 0.8) {
                currentProgress += 0.05;
                setProgress((prev) => ({
                  ...prev,
                  [itemId]: {
                    ...prev[itemId],
                    progress: currentProgress,
                  },
                }));
              }
            }, 300);

            try {
              let uploadError = null;

              // For React Native with Expo
              if (Platform.OS !== "web") {
                // Read file as base64 but use it directly for upload
                // This is the most reliable way in Expo/React Native
                const base64File = await FileSystem.readAsStringAsync(uri, {
                  encoding: FileSystem.EncodingType.Base64,
                });

                // Create a Blob-like object from base64 data
                // This is crucial for binary file integrity
                const fileData = {
                  uri: `data:${mimeType};base64,${base64File}`,
                };

                // Upload to Supabase Storage
                const { error } = await supabase.storage
                  .from("transfers")
                  .upload(filePath, fileData as any, {
                    contentType: mimeType,
                    upsert: false,
                  });

                uploadError = error;
              } else {
                // For web platform
                const response = await fetch(uri);
                const blob = await response.blob();

                const { error } = await supabase.storage
                  .from("transfers")
                  .upload(filePath, blob, {
                    contentType: mimeType,
                    upsert: false,
                  });

                uploadError = error;
              }

              // Clear the progress interval
              clearInterval(progressInterval);

              if (uploadError) {
                throw uploadError;
              }
            } catch (uploadError) {
              clearInterval(progressInterval);
              throw uploadError;
            }

            // Update status to processing (creating record)
            setProgress((prev) => ({
              ...prev,
              [itemId]: {
                ...prev[itemId],
                status: "processing",
                progress: 0.9,
              },
            }));

            // Create file record
            const { data: fileData, error: fileError } = await supabase
              .from("transfer_files")
              .insert({
                transfer_id: transferId,
                file_name: name,
                file_type: mimeType,
                file_size: size,
                storage_path: filePath,
              })
              .select()
              .single();

            if (fileError) {
              throw fileError;
            }

            // Update status to completed
            setProgress((prev) => ({
              ...prev,
              [itemId]: { status: "completed", progress: 1 },
            }));

            uploadedFiles.push(fileData);
          } catch (fileError) {
            console.error(`Error processing ${name}:`, fileError);
            setProgress((prev) => ({
              ...prev,
              [itemId]: {
                status: "error",
                progress: 0,
                error:
                  fileError instanceof Error
                    ? fileError.message
                    : "Upload failed",
              },
            }));
          }
        }

        if (uploadedFiles.length > 0) {
          // Update transfer file count and total size
          await supabase
            .from("transfers")
            .update({
              file_count: supabase.rpc("get_file_count", {
                transfer_id: transferId,
              }),
              total_size: supabase.rpc("get_total_size", {
                transfer_id: transferId,
              }),
            })
            .eq("id", transferId);
        }
        console.log("Upload complete", uploadedFiles);
        return {
          data: uploadedFiles,
          error: null,
          failures: selectedItems.length - uploadedFiles.length,
        };
      } catch (err) {
        const error = err as Error;
        console.error("Upload error:", error);
        setError(error);
        return { data: [], error, failures: 0 };
      } finally {
        setUploading(false);
      }
    },
    []
  );

  return {
    uploadSelectedItems,
    uploading,
    progress,
    error,
    clearError: () => setError(null),
    resetProgress: () => setProgress({}),
  };
}
