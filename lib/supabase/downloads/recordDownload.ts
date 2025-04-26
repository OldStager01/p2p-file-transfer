import { supabase } from "../client";

/**
 * Record a file download in the database
 * @param fileId ID of the downloaded file
 * @param downloadPath Local path where file was saved
 * @returns Status of the operation
 */
export const recordDownload = async (
  fileId: string,
  downloadPath: string
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Anonymous downloads are not recorded
      return { success: true, error: null };
    }

    // Record the download
    const { error } = await supabase.rpc("record_download", {
      p_user_id: user.id,
      p_file_id: fileId,
      p_download_path: downloadPath,
    });

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Record download error:", error);
    return { success: false, error: error as Error };
  }
};

/**
 * Delete a download record
 * @param downloadId ID of the download record
 * @returns Status of the operation
 */
export const deleteDownloadRecord = async (
  downloadId: string
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Delete the download record
    const { error } = await supabase
      .from("downloads")
      .delete()
      .eq("id", downloadId)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Delete download record error:", error);
    return { success: false, error: error as Error };
  }
};
