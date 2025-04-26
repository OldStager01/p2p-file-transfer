/**
 * Custom hook for managing files
 * Created: 2025-04-25 02:50:14 UTC
 * Author: OldStager01
 */

import { useState, useCallback } from "react";
import {
  uploadFiles,
  downloadFile,
  shareFile,
  getFilesForTransfer,
  getFileUrl,
} from "../lib/supabase/files";
import {
  recordDownload,
  getUserDownloads,
  clearDownloadHistory,
  deleteDownloadRecord,
} from "../lib/supabase/downloads";
import { useAuth } from "./useAuth";
import { FileData } from "../types";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";

interface FilesState {
  files: any[];
  downloadHistory: any[];
  selectedFile: any | null;
  uploading: boolean;
  downloading: Record<string, { progress: number; status: string }>;
  loading: boolean;
  error: Error | null;
}

export function useFiles() {
  const { user } = useAuth();
  const [state, setState] = useState<FilesState>({
    files: [],
    downloadHistory: [],
    selectedFile: null,
    uploading: false,
    downloading: {},
    loading: false,
    error: null,
  });

  // Load files for a transfer
  const loadFiles = useCallback(
    async (transferId: string) => {
      if (!user) return;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { data, error } = await getFilesForTransfer(transferId);

        if (error) {
          throw error;
        }

        setState((prev) => ({
          ...prev,
          files: data,
          loading: false,
          error: null,
        }));

        return data;
      } catch (error) {
        console.error("Load files error:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error as Error,
        }));
        throw error;
      }
    },
    [user]
  );

  // // Upload files to a transfer
  // const upload = async (transferId: string, files: FileData[]) => {
  //   if (!user) {
  //     throw new Error("User must be logged in to upload files");
  //   }

  //   setState((prev) => ({ ...prev, uploading: true, error: null }));

  //   try {
  //     const { data, error } = await uploadFiles(transferId, files);

  //     if (error) {
  //       throw error;
  //     }

  //     setState((prev) => ({
  //       ...prev,
  //       files: [...prev.files, ...data],
  //       uploading: false,
  //       error: null,
  //     }));

  //     return data;
  //   } catch (error) {
  //     console.error("Upload files error:", error);
  //     setState((prev) => ({
  //       ...prev,
  //       uploading: false,
  //       error: error as Error,
  //     }));
  //     throw error;
  //   }
  // };

  // Download a file
  const download = async (fileId: string, transferCode: string) => {
    // Update state to show download starting
    setState((prev) => ({
      ...prev,
      downloading: {
        ...prev.downloading,
        [fileId]: { progress: 0, status: "starting" },
      },
      error: null,
    }));

    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Media library permission not granted");
      }

      // Start download
      setState((prev) => ({
        ...prev,
        downloading: {
          ...prev.downloading,
          [fileId]: { progress: 0.1, status: "downloading" },
        },
      }));

      // Get download URL
      const { url, success, localPath, error } = await downloadFile(
        fileId,
        transferCode
      );

      if (error || !success || !localPath) {
        throw error || new Error("Download failed");
      }

      // Update progress
      setState((prev) => ({
        ...prev,
        downloading: {
          ...prev.downloading,
          [fileId]: { progress: 0.5, status: "processing" },
        },
      }));

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(localPath);

      // Record the download
      if (user) {
        await recordDownload(fileId, localPath);
      }

      // Update state to show download completed
      setState((prev) => ({
        ...prev,
        downloading: {
          ...prev.downloading,
          [fileId]: { progress: 1, status: "completed" },
        },
      }));

      return {
        success: true,
        asset,
        localPath,
      };
    } catch (error) {
      console.error("Download error:", error);
      setState((prev) => ({
        ...prev,
        downloading: {
          ...prev.downloading,
          [fileId]: { progress: 0, status: "failed" },
        },
        error: error as Error,
      }));
      throw error;
    }
  };

  // Share a file
  const share = async (filePath: string) => {
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (!isSharingAvailable) {
        throw new Error("Sharing is not available on this device");
      }

      await Sharing.shareAsync(filePath);

      return { success: true };
    } catch (error) {
      console.error("Share error:", error);
      setState((prev) => ({ ...prev, error: error as Error }));
      throw error;
    }
  };

  // Get signed URL for a file
  const getUrl = async (fileId: string) => {
    if (!user) {
      throw new Error("User must be logged in to get file URL");
    }

    try {
      const { url, error } = await getFileUrl(fileId);

      if (error) {
        throw error;
      }

      return url;
    } catch (error) {
      console.error("Get URL error:", error);
      setState((prev) => ({ ...prev, error: error as Error }));
      throw error;
    }
  };

  // Load user's download history
  const loadDownloadHistory = useCallback(async () => {
    if (!user) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await getUserDownloads();

      if (error) {
        throw error;
      }

      setState((prev) => ({
        ...prev,
        downloadHistory: data,
        loading: false,
        error: null,
      }));

      return data;
    } catch (error) {
      console.error("Load download history error:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
      throw error;
    }
  }, [user]);

  // Clear download history
  const clearHistory = async () => {
    if (!user) {
      throw new Error("User must be logged in to clear download history");
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { success, error } = await clearDownloadHistory();

      if (error) {
        throw error;
      }

      if (!success) {
        throw new Error("Failed to clear download history");
      }

      setState((prev) => ({
        ...prev,
        downloadHistory: [],
        loading: false,
        error: null,
      }));

      return { success: true };
    } catch (error) {
      console.error("Clear download history error:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
      throw error;
    }
  };

  // Delete a download record
  const deleteDownload = async (downloadId: string) => {
    if (!user) {
      throw new Error("User must be logged in to delete download record");
    }

    try {
      const { success, error } = await deleteDownloadRecord(downloadId);

      if (error) {
        throw error;
      }

      if (!success) {
        throw new Error("Failed to delete download record");
      }

      setState((prev) => ({
        ...prev,
        downloadHistory: prev.downloadHistory.filter(
          (d) => d.id !== downloadId
        ),
      }));

      return { success: true };
    } catch (error) {
      console.error("Delete download record error:", error);
      setState((prev) => ({ ...prev, error: error as Error }));
      throw error;
    }
  };

  // Check if a local file exists
  const checkFileExists = async (localPath: string): Promise<boolean> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      return fileInfo.exists;
    } catch (error) {
      console.error("Check file exists error:", error);
      return false;
    }
  };

  // Delete a local file
  const deleteLocalFile = async (localPath: string): Promise<boolean> => {
    try {
      const exists = await checkFileExists(localPath);

      if (!exists) {
        return true; // File doesn't exist, so technically it's deleted
      }

      await FileSystem.deleteAsync(localPath);
      return true;
    } catch (error) {
      console.error("Delete local file error:", error);
      return false;
    }
  };

  // Select a file for viewing
  const selectFile = (file: any) => {
    setState((prev) => ({
      ...prev,
      selectedFile: file,
    }));
  };

  // Clear selected file
  const clearSelectedFile = () => {
    setState((prev) => ({
      ...prev,
      selectedFile: null,
    }));
  };

  return {
    files: state.files,
    downloadHistory: state.downloadHistory,
    selectedFile: state.selectedFile,
    downloading: state.downloading,
    uploading: state.uploading,
    loading: state.loading,
    error: state.error,
    loadFiles,
    // uploadFiles: upload,
    downloadFile: download,
    shareFile: share,
    getFileUrl: getUrl,
    loadDownloadHistory,
    clearDownloadHistory: clearHistory,
    deleteDownloadRecord: deleteDownload,
    checkFileExists,
    deleteLocalFile,
    selectFile,
    clearSelectedFile,
  };
}
