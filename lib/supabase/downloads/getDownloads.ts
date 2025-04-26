import { supabase } from "../client";

interface GetDownloadsOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

/**
 * Get user's download history
 * @param options Query options
 * @returns Array of download records or error
 */
export const getUserDownloads = async (
  options: GetDownloadsOptions = {}
): Promise<{ data: any[]; error: Error | null }> => {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const {
      limit = 50,
      offset = 0,
      orderBy = "downloaded_at",
      orderDirection = "desc",
    } = options;

    // Get downloads
    const { data, error } = await supabase
      .from("downloads")
      .select("*")
      .eq("user_id", user.id)
      .order(orderBy, { ascending: orderDirection === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error("Get downloads error:", error);
    return { data: [], error: error as Error };
  }
};

/**
 * Clear all download history for the user
 * @returns Status of the operation
 */
export const clearDownloadHistory = async (): Promise<{
  success: boolean;
  error: Error | null;
}> => {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Delete all download records for this user
    const { error } = await supabase
      .from("downloads")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Clear download history error:", error);
    return { success: false, error: error as Error };
  }
};
