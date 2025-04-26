import { supabase } from "../client";

/**
 * Request access to a private transfer
 * @param transferId ID of the transfer
 * @param email Email to request access for
 * @param message Optional message for the transfer owner
 * @returns Status of the request or error
 */
export const requestTransferAccess = async (
  transferId: string,
  email: string,
  message: string = ""
): Promise<{ data: any; error: Error | null }> => {
  try {
    // Get current user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Create access request
    const { data, error } = await supabase
      .from("access_requests")
      .insert({
        transfer_id: transferId,
        user_id: user?.id,
        email: email.trim().toLowerCase(),
        message: message.trim(),
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Request access error:", error);
    return { data: null, error: error as Error };
  }
};

/**
 * Check status of access request
 * @param requestId ID of the access request
 * @returns Status of the request or error
 */
export const checkAccessRequestStatus = async (
  requestId: string
): Promise<{ status: string; error: Error | null }> => {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get request status
    const { data, error } = await supabase
      .from("access_requests")
      .select("status")
      .eq("id", requestId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      throw error;
    }

    return { status: data.status, error: null };
  } catch (error) {
    console.error("Check access request status error:", error);
    return { status: "unknown", error: error as Error };
  }
};
