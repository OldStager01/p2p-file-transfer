import { supabase } from "../client";

/**
 * Delete/revoke a transfer
 * @param transferId ID of the transfer to delete
 * @returns Status of the operation
 */
export const deleteTransfer = async (
  transferId: string
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get files to delete from storage
    const { data: files } = await supabase
      .from("transfer_files")
      .select("storage_path")
      .eq("transfer_id", transferId);

    // Delete the transfer (cascades to transfer_files and transfer_access)
    const { error } = await supabase
      .from("transfers")
      .delete()
      .eq("id", transferId)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    // Delete files from storage
    if (files && files.length > 0) {
      const filePaths = files.map((file) => file.storage_path);
      await supabase.storage.from("transfers").remove(filePaths);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Delete transfer error:", error);
    return { success: false, error: error as Error };
  }
};

/**
 * Soft delete (deactivate) a transfer
 * @param transferId ID of the transfer to deactivate
 * @returns Status of the operation
 */
export const deactivateTransfer = async (
  transferId: string
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Update the transfer status
    const { error } = await supabase
      .from("transfers")
      .update({ is_active: false })
      .eq("id", transferId)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Deactivate transfer error:", error);
    return { success: false, error: error as Error };
  }
};
