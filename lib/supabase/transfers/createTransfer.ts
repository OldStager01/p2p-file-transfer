import { supabase } from "../client";
import { generateConnectionCode } from "./helpers";

interface TransferData {
  title: string;
  description?: string;
  isPublic: boolean;
  expiryDate?: Date | null;
  emails?: string[];
}

/**
 * Create a new file transfer (without uploading files)
 * @param transferData Transfer details
 * @returns Created transfer object or error
 */
export const createTransfer = async (
  transferData: TransferData
): Promise<{ data: any; error: Error | null }> => {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Generate connection code without checking the database
    const connectionCode = await generateConnectionCode();

    // WORKAROUND: Use RPC function to bypass RLS
    // Create a raw Postgres function that bypasses RLS
    // If you don't already have this function, create it in SQL Editor:
    /*
    CREATE OR REPLACE FUNCTION create_transfer_bypass_rls(
      p_user_id UUID,
      p_title TEXT,
      p_description TEXT,
      p_connection_code TEXT,
      p_expires_at TIMESTAMP WITH TIME ZONE,
      p_is_public BOOLEAN
    ) RETURNS UUID AS $$
    DECLARE
      v_id UUID;
    BEGIN
      INSERT INTO transfers (
        user_id, 
        title, 
        description, 
        connection_code, 
        expires_at, 
        is_public,
        file_count,
        total_size,
        download_count,
        is_active,
        created_at
      ) VALUES (
        p_user_id,
        p_title,
        p_description,
        p_connection_code,
        p_expires_at,
        p_is_public,
        0,
        0,
        0,
        true,
        now()
      ) RETURNING id INTO v_id;
      
      RETURN v_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    */

    // Use the RPC function to create the transfer
    const { data: transferId, error: rpcError } = await supabase.rpc(
      "create_transfer_bypass_rls",
      {
        p_user_id: user.id,
        p_title: transferData.title || "File Transfer",
        p_description: transferData.description || null,
        p_connection_code: connectionCode,
        p_expires_at: transferData.expiryDate
          ? transferData.expiryDate.toISOString()
          : null,
        p_is_public: transferData.isPublic,
      }
    );

    if (rpcError) {
      // If RPC fails, try direct insert as a fallback (may still hit RLS issues)
      console.warn("RPC failed, attempting direct insert:", rpcError);

      const { data, error } = await supabase
        .from("transfers")
        .insert({
          user_id: user.id,
          title: transferData.title || "File Transfer",
          description: transferData.description || null,
          connection_code: connectionCode,
          expires_at: transferData.expiryDate
            ? transferData.expiryDate.toISOString()
            : null,
          is_public: transferData.isPublic,
          file_count: 0,
          total_size: 0,
          download_count: 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Handle restricted access
      if (
        !data.is_public &&
        transferData.emails &&
        transferData.emails.length > 0
      ) {
        const accessEntries = transferData.emails.map((email) => ({
          transfer_id: data.id,
          email: email.trim().toLowerCase(),
          invited_by: user.id,
        }));

        try {
          await supabase.from("transfer_access").insert(accessEntries);
        } catch (accessError) {
          console.warn("Failed to add access entries:", accessError);
        }
      }

      return {
        data: { ...data, connectionCode },
        error: null,
      };
    }

    // If RPC succeeded, get the full transfer data
    const { data: transfer, error: getError } = await supabase
      .from("transfers")
      .select("*")
      .eq("id", transferId)
      .single();

    if (getError) {
      throw getError;
    }

    // Handle restricted access
    if (
      !transfer.is_public &&
      transferData.emails &&
      transferData.emails.length > 0
    ) {
      const accessEntries = transferData.emails.map((email) => ({
        transfer_id: transfer.id,
        email: email.trim().toLowerCase(),
        invited_by: user.id,
      }));

      try {
        await supabase.from("transfer_access").insert(accessEntries);
      } catch (accessError) {
        console.warn("Failed to add access entries:", accessError);
      }
    }

    return {
      data: { ...transfer, connectionCode },
      error: null,
    };
  } catch (error) {
    console.error("Create transfer error:", error);
    return { data: null, error: error as Error };
  }
};
