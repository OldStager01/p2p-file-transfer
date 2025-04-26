import { supabase } from "../client";

/**
 * Get access requests for a transfer
 * @param transferId ID of the transfer
 * @returns Array of access requests or error
 */
export const getAccessRequests = async (
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

    // Get access requests
    const { data, error } = await supabase
      .from("access_requests")
      .select("*")
      .eq("transfer_id", transferId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error("Get access requests error:", error);
    return { data: [], error: error as Error };
  }
};

/**
 * Update access request status
 * @param requestId ID of the access request
 * @param status New status (approved/rejected)
 * @returns Status of the operation
 */
export const updateAccessRequest = async (
  requestId: string,
  status: "approved" | "rejected"
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get the request with transfer info
    const { data: request, error: requestError } = await supabase
      .from("access_requests")
      .select(
        `
        id, 
        transfer_id, 
        email, 
        transfers!inner (
          user_id
        )
      `
      )
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      throw new Error("Request not found");
    }

    // Verify this transfer belongs to the user
    if (request.transfers.user_id !== user.id) {
      throw new Error("You do not have permission to manage this request");
    }

    // Update the request
    const { error: updateError } = await supabase
      .from("access_requests")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      throw updateError;
    }

    // If approved, add email to transfer_access
    if (status === "approved") {
      const { error: accessError } = await supabase
        .from("transfer_access")
        .insert({
          transfer_id: request.transfer_id,
          email: request.email,
          invited_by: user.id,
        });

      if (accessError) {
        console.error("Error adding email to access list:", accessError);
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Update access request error:", error);
    return { success: false, error: error as Error };
  }
};

/**
 * Get emails that have access to a transfer
 * @param transferId ID of the transfer
 * @returns Array of emails or error
 */
export const getAccessList = async (
  transferId: string
): Promise<{ data: string[]; error: Error | null }> => {
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

    // Get emails with access
    const { data, error } = await supabase
      .from("transfer_access")
      .select("email")
      .eq("transfer_id", transferId);

    if (error) {
      throw error;
    }

    return { data: data.map((item) => item.email), error: null };
  } catch (error) {
    console.error("Get access list error:", error);
    return { data: [], error: error as Error };
  }
};

/**
 * Add email to transfer access list
 * @param transferId ID of the transfer
 * @param email Email to add
 * @returns Status of the operation
 */
export const addEmailToAccessList = async (
  transferId: string,
  email: string
): Promise<{ success: boolean; error: Error | null }> => {
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
      .select("id, user_id, is_public")
      .eq("id", transferId)
      .eq("user_id", user.id)
      .single();

    if (transferError || !transfer) {
      throw new Error("Transfer not found or you do not have permission");
    }

    // Ensure transfer is private
    if (transfer.is_public) {
      // Update transfer to private
      await supabase
        .from("transfers")
        .update({ is_public: false })
        .eq("id", transferId);
    }

    // Add email to access list
    const { error } = await supabase.from("transfer_access").insert({
      transfer_id: transferId,
      email: email.trim().toLowerCase(),
      invited_by: user.id,
    });

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Add email to access list error:", error);
    return { success: false, error: error as Error };
  }
};

/**
 * Remove email from transfer access list
 * @param transferId ID of the transfer
 * @param email Email to remove
 * @returns Status of the operation
 */
export const removeEmailFromAccessList = async (
  transferId: string,
  email: string
): Promise<{ success: boolean; error: Error | null }> => {
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

    // Remove email from access list
    const { error } = await supabase
      .from("transfer_access")
      .delete()
      .eq("transfer_id", transferId)
      .eq("email", email.trim().toLowerCase());

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Remove email from access list error:", error);
    return { success: false, error: error as Error };
  }
};
