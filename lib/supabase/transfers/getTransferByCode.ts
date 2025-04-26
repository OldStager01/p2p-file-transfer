import { supabase } from "../client";

/**
 * Get a transfer using its connection code
 * @param code Connection code
 * @param email User email (for access checking)
 * @returns Transfer object with files or error
 */
export const getTransferByCode = async (
  code: string,
  email?: string | null
): Promise<{ data: any; error: Error | null }> => {
  try {
    // Call the RPC function to get transfer with proper RLS
    const { data: transfers, error } = await supabase.rpc(
      "get_transfer_by_code",
      { code, user_email: email || null }
    );

    if (error) {
      throw error;
    }

    if (!transfers || transfers.length === 0) {
      throw new Error("Transfer not found or has expired");
    }

    const transfer = transfers[0];

    // Check if transfer is valid
    if (!transfer.is_active) {
      throw new Error("This transfer has been deactivated");
    }

    if (transfer.expires_at && new Date(transfer.expires_at) < new Date()) {
      throw new Error("This transfer has expired");
    }

    // Check if user has access
    if (!transfer.is_public && !transfer.has_access) {
      throw new Error("You do not have access to this transfer");
    }

    // Get files if user has access
    let files = [];
    if (transfer.has_access) {
      const { data: filesData, error: filesError } = await supabase.rpc(
        "get_files_for_transfer",
        { transfer_id: transfer.id, user_email: email || null }
      );

      if (filesError) {
        console.error("Error fetching files:", filesError);
      } else {
        files = filesData || [];
      }
    }

    return {
      data: {
        ...transfer,
        files,
      },
      error: null,
    };
  } catch (error) {
    console.error("Get transfer by code error:", error);
    return { data: null, error: error as Error };
  }
};
