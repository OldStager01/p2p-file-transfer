/**
 * Custom hook for file uploads with progress tracking
 * Created: 2025-04-26 00:04:03
 * Author: OldStager01
 */

import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase/client";
import { SelectedItemType, ItemType } from "../types";
import * as FileSystem from "expo-file-system";

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
        const uploadPromises = selectedItems.map(async (item) => {
          // Only process files and media
          if (![ItemType.File, ItemType.Media].includes(item.type)) {
            return null;
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

            // For demo: simulate upload progress
            // In production: integrate with a proper upload progress mechanism
            const progressInterval = setInterval(() => {
              setProgress((prev) => {
                const currentProgress = prev[itemId]?.progress || 0;
                if (
                  currentProgress < 0.9 &&
                  prev[itemId]?.status === "uploading"
                ) {
                  return {
                    ...prev,
                    [itemId]: {
                      ...prev[itemId],
                      progress: currentProgress + 0.1,
                    },
                  };
                }
                return prev;
              });
            }, 300);

            // Read file as base64
            const fileContent = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });

            // Update status to processing (converting and uploading)
            setProgress((prev) => ({
              ...prev,
              [itemId]: {
                ...prev[itemId],
                status: "processing",
                progress: 0.9,
              },
            }));

            // Upload file to storage
            const { error: uploadError } = await supabase.storage
              .from("transfers")
              .upload(filePath, fileContent, {
                contentType: mimeType,
                cacheControl: "3600",
                upsert: false,
              });

            clearInterval(progressInterval);

            if (uploadError) {
              setProgress((prev) => ({
                ...prev,
                [itemId]: {
                  status: "error",
                  progress: 0,
                  error: uploadError.message,
                },
              }));
              throw uploadError;
            }

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
              setProgress((prev) => ({
                ...prev,
                [itemId]: {
                  status: "error",
                  progress: 0,
                  error: fileError.message,
                },
              }));
              throw fileError;
            }

            // Update status to completed
            setProgress((prev) => ({
              ...prev,
              [itemId]: { status: "completed", progress: 1 },
            }));

            uploadedFiles.push(fileData);
            return fileData;
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
            return null;
          }
        });

        // Wait for all uploads to complete
        const results = await Promise.allSettled(uploadPromises);

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

        return {
          data: uploadedFiles,
          error: null,
          failures: results.filter((r) => r.status === "rejected").length,
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
