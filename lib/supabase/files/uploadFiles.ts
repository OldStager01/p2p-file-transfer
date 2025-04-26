import { supabase } from "../client";
import { SelectedItemType, ItemType } from "../../../types";
import * as FileSystem from "expo-file-system";

/**
 * Upload files to an existing transfer
 * @param transferId ID of the transfer
 * @param selectedItems Array of selected items to upload
 * @returns Array of uploaded file records or error
 */
export const uploadFiles = async (
  transferId: string,
  selectedItems: SelectedItemType[]
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

    const uploadedFiles = [];

    // Upload each file
    for (const item of selectedItems) {
      // Only process files and media
      if (![ItemType.File, ItemType.Media].includes(item.type)) {
        continue;
      }

      const { name, uri, size, mimeType } = item.data;

      try {
        // Generate unique storage path
        const filePath = `${user.id}/${transferId}/${Date.now()}_${name.replace(
          /\s+/g,
          "_"
        )}`;

        // Read file as base64
        const fileContent = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from("transfers")
          .upload(filePath, fileContent, {
            contentType: mimeType,
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error(`Error uploading ${name}:`, uploadError);
          continue;
        }

        // Create file record
        const { data: fileData, error: fileError } = await supabase
          .from("transfer_files")
          .insert({
            transfer_id: transferId,
            file_name: name,
            file_type: mimeType,
            file_size: size,
            storage_path: filePath,
          })
          .select()
          .single();

        if (fileError) {
          console.error(`Error creating record for ${name}:`, fileError);
        } else {
          uploadedFiles.push(fileData);
        }
      } catch (fileError) {
        console.error(`Error processing ${name}:`, fileError);
      }
    }

    if (uploadedFiles.length > 0) {
      // Update transfer file count and total size
      await supabase
        .from("transfers")
        .update({
          file_count: supabase.rpc("get_file_count", {
            transfer_id: transferId,
          }),
          total_size: supabase.rpc("get_total_size", {
            transfer_id: transferId,
          }),
        })
        .eq("id", transferId);
    }

    return { data: uploadedFiles, error: null };
  } catch (error) {
    console.error("Upload files error:", error);
    return { data: [], error: error as Error };
  }
};
