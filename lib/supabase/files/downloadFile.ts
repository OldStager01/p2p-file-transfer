import { supabase } from "../client";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

/**
 * Download a file from a transfer
 * @param fileId ID of the file to download
 * @param transferCode Transfer connection code
 * @returns Download information or error
 */
export const downloadFile = async (
  fileId: string,
  transferCode: string
): Promise<{
  url: string | null;
  success: boolean;
  localPath: string | null;
  error: Error | null;
}> => {
  try {
    // Get current user if logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch file information
    const { data: file, error: fileError } = await supabase
      .from("transfer_files")
      .select(
        `
        id,
        file_name,
        file_type,
        file_size,
        storage_path,
        transfer_id,
        transfers!inner (
          connection_code,
          is_public,
          is_active,
          expires_at
        )
      `
      )
      .eq("id", fileId)
      .eq("transfers.connection_code", transferCode)
      .single();

    if (fileError || !file) {
      throw new Error("File not found or you do not have permission");
    }

    // Verify transfer is active and not expired
    if (!file.transfers.is_active) {
      throw new Error("This transfer has been deactivated");
    }

    if (
      file.transfers.expires_at &&
      new Date(file.transfers.expires_at) < new Date()
    ) {
      throw new Error("This transfer has expired");
    }

    // Get temporary URL for the file
    const { data: urlData, error: urlError } = await supabase.storage
      .from("transfers")
      .createSignedUrl(file.storage_path, 3600); // Valid for 1 hour

    if (urlError) {
      throw urlError;
    }

    // Download the file using Expo FileSystem
    const localUri = FileSystem.documentDirectory + file.file_name;
    const downloadResult = await FileSystem.downloadAsync(
      urlData.signedUrl,
      localUri
    );

    if (downloadResult.status !== 200) {
      throw new Error(`Download failed with status ${downloadResult.status}`);
    }

    // Record the download if user is authenticated
    if (user) {
      await supabase.rpc("record_download", {
        p_user_id: user.id,
        p_file_id: fileId,
        p_download_path: localUri,
      });
    }

    return {
      url: urlData.signedUrl,
      localPath: downloadResult.uri,
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Download file error:", error);
    return {
      url: null,
      localPath: null,
      success: false,
      error: error as Error,
    };
  }
};

/**
 * Share a downloaded file
 * @param filePath Local path to the file
 * @returns Success status
 */
export const shareFile = async (
  filePath: string
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Check if sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync();

    if (!isSharingAvailable) {
      throw new Error("Sharing is not available on this device");
    }

    await Sharing.shareAsync(filePath);

    return { success: true, error: null };
  } catch (error) {
    console.error("Share file error:", error);
    return { success: false, error: error as Error };
  }
};
