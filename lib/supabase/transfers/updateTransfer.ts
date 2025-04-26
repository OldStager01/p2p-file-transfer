import { supabase } from "../client";

interface UpdateTransferData {
  id: string;
  title?: string;
  description?: string;
  isPublic?: boolean;
  expiryDate?: Date | null;
  isActive?: boolean;
  emails?: string[];
}

/**
 * Update an existing transfer
 * @param transferData Updated transfer data
 * @returns Updated transfer object or error
 */
export const updateTransfer = async (
  transferData: UpdateTransferData
): Promise<{ data: any; error: Error | null }> => {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Update the transfer
    const updateObj: Record<string, any> = {};

    if (transferData.title !== undefined) updateObj.title = transferData.title;
    if (transferData.description !== undefined)
      updateObj.description = transferData.description;
    if (transferData.isPublic !== undefined)
      updateObj.is_public = transferData.isPublic;
    if (transferData.isActive !== undefined)
      updateObj.is_active = transferData.isActive;
    if (transferData.expiryDate !== undefined) {
      updateObj.expires_at = transferData.expiryDate
        ? transferData.expiryDate.toISOString()
        : null;
    }

    const { data, error } = await supabase
      .from("transfers")
      .update(updateObj)
      .eq("id", transferData.id)
      .eq("user_id", user.id) // Ensure user owns this transfer
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update access permissions if needed
    if (
      transferData.isPublic !== undefined ||
      transferData.emails !== undefined
    ) {
      if (
        transferData.isPublic === false &&
        transferData.emails &&
        transferData.emails.length > 0
      ) {
        // Delete existing access records
        await supabase
          .from("transfer_access")
          .delete()
          .eq("transfer_id", transferData.id);

        // Insert new access records
        const accessEntries = transferData.emails.map((email) => ({
          transfer_id: transferData.id,
          email: email.trim().toLowerCase(),
          invited_by: user.id,
        }));

        await supabase.from("transfer_access").insert(accessEntries);
      } else if (transferData.isPublic === true) {
        // If made public, remove all access restrictions
        await supabase
          .from("transfer_access")
          .delete()
          .eq("transfer_id", transferData.id);
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error("Update transfer error:", error);
    return { data: null, error: error as Error };
  }
};

/**
 * Extend the expiry date of a transfer
 * @param transferId ID of the transfer to extend
 * @param days Number of days to extend from current expiry
 * @returns Updated transfer object or error
 */
export const extendTransferExpiry = async (
  transferId: string,
  days: number = 7
): Promise<{ data: any; error: Error | null }> => {
  try {
    // Get current user and transfer
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get current expiry date
    const { data: transfer, error: getError } = await supabase
      .from("transfers")
      .select("expires_at")
      .eq("id", transferId)
      .eq("user_id", user.id)
      .single();

    if (getError) {
      throw getError;
    }

    // Calculate new expiry date
    let newExpiryDate: Date;
    if (transfer.expires_at) {
      // Extend from current expiry
      newExpiryDate = new Date(transfer.expires_at);
    } else {
      // No current expiry, use current date as base
      newExpiryDate = new Date();
    }

    // Add days
    newExpiryDate.setDate(newExpiryDate.getDate() + days);

    // Update the transfer
    const { data, error } = await supabase
      .from("transfers")
      .update({
        expires_at: newExpiryDate.toISOString(),
        is_active: true, // Reactivate if it was inactive
      })
      .eq("id", transferId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Extend transfer expiry error:", error);
    return { data: null, error: error as Error };
  }
};
