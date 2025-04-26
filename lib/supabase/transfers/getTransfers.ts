import { supabase } from "../client";

interface GetTransfersOptions {
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Get current user's transfers
 * @param options Query options
 * @returns Array of transfers or error
 */
export const getUserTransfers = async (
  options: GetTransfersOptions = {}
): Promise<{ data: any[]; error: Error | null }> => {
  try {
    const { isActive = true, limit = 20, offset = 0 } = options;

    let query = supabase
      .from("transfers")
      .select(
        `
        *,
        transfer_files (count),
        transfer_access (*)
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply active filter if specified
    if (isActive !== undefined) {
      query = query.eq("is_active", isActive);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Get transfers error:", error);
    return { data: [], error: error as Error };
  }
};

/**
 * Get transfers that are expiring soon
 * @param daysThreshold Number of days threshold
 * @returns Array of transfers expiring soon
 */
export const getExpiringTransfers = async (
  daysThreshold: number = 3
): Promise<{ data: any[]; error: Error | null }> => {
  try {
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + daysThreshold);

    const { data, error } = await supabase
      .from("transfers")
      .select(
        `
        *,
        transfer_files (count)
      `
      )
      .eq("is_active", true)
      .lt("expires_at", thresholdDate.toISOString())
      .gt("expires_at", now.toISOString())
      .order("expires_at", { ascending: true });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Get expiring transfers error:", error);
    return { data: [], error: error as Error };
  }
};
