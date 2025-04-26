import { supabase } from "../client";

/**
 * Get all files for a transfer
 * @param transferId ID of the transfer
 * @returns Array of file records or error
 */
export const getFilesForTransfer = async (
  transferId: string
): Promise<{ data: any[]; error: Error | null }> => {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Verify this transfer belongs to the user
    const { data: transfer, error: transferError } = await supabase
      .from("transfers")
      .select("id, user_id")
      .eq("id", transferId)
      .eq("user_id", user.id)
      .single();

    if (transferError || !transfer) {
      throw new Error("Transfer not found or you do not have permission");
    }

    // Get files
    const { data, error } = await supabase
      .from("transfer_files")
      .select("*")
      .eq("transfer_id", transferId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error("Get files error:", error);
    return { data: [], error: error as Error };
  }
};

/**
 * Get download URL for a file
 * @param fileId ID of the file
 * @returns Signed URL or error
 */
export const getFileUrl = async (
  fileId: string
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get file path
    const { data: file, error: fileError } = await supabase
      .from("transfer_files")
      .select(
        `
        storage_path,
        transfers!inner (user_id)
      `
      )
      .eq("id", fileId)
      .single();

    if (fileError || !file) {
      throw new Error("File not found");
    }

    // Verify owner
    if (file.transfers.user_id !== user.id) {
      throw new Error("You do not have permission to access this file");
    }

    // Get signed URL
    const { data, error } = await supabase.storage
      .from("transfers")
      .createSignedUrl(file.storage_path, 3600); // Valid for 1 hour

    if (error) {
      throw error;
    }

    return { url: data.signedUrl, error: null };
  } catch (error) {
    console.error("Get file URL error:", error);
    return { url: null, error: error as Error };
  }
};
