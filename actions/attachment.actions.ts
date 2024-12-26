// attachment.actions.ts
"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { TablesInsert } from "@/types/database.types";

// Upload attachment action
export const uploadAttachmentAction = async (
  file: File,
  attachment: TablesInsert<"attachments">,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    // Generate storage path
    const timestamp = Date.now();
    const storagePath = `attachments/${attachment.content_type}/${attachment.content_id}/${timestamp}-${file.name}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(storagePath, file);

    if (uploadError) throw uploadError;

    // Create attachment record
    const { data, error } = await supabase
      .from("attachments")
      .insert({
        ...attachment,
        uploaded_by: userData.user.id,
        storage_path: storagePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      })
      .select()
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Delete attachment action
export const deleteAttachmentAction = async (attachmentId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    // Get attachment to delete storage file
    const { data: attachment, error: getError } = await supabase
      .from("attachments")
      .select()
      .eq("id", attachmentId)
      .single();

    if (getError) throw getError;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("attachments")
      .remove([attachment.storage_path]);

    if (storageError) throw storageError;

    // Delete record
    const { error } = await supabase
      .from("attachments")
      .delete()
      .eq("id", attachmentId);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// List attachments action
export const listAttachmentsAction = async (
  contentType: string,
  contentId: string,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("attachments")
      .select(
        `
        *,
        uploader:profiles (
          id,
          display_name,
          avatar_url
        )
      `,
      )
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Get attachment URL action
export const getAttachmentUrlAction = async (storagePath: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase.storage
      .from("attachments")
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error) throw error;

    return getActionResponse({ data: data.signedUrl });
  } catch (error) {
    return getActionResponse({ error });
  }
};
