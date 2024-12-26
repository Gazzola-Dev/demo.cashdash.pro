// comment.actions.ts
"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { TablesInsert, TablesUpdate } from "@/types/database.types";

// Create comment action
export const createCommentAction = async (
  comment: TablesInsert<"comments">,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    // Insert comment with user id
    const { data, error } = await supabase
      .from("comments")
      .insert({
        ...comment,
        user_id: userData.user.id,
      })
      .select(
        `
        *,
        user:profiles (
          id,
          display_name,
          avatar_url
        )
      `,
      )
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Update comment action
export const updateCommentAction = async (
  commentId: string,
  updates: TablesUpdate<"comments">,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    // Verify comment ownership
    const { data: existingComment, error: verifyError } = await supabase
      .from("comments")
      .select()
      .eq("id", commentId)
      .single();

    if (verifyError || existingComment.user_id !== userData.user.id) {
      throw new Error("Permission denied");
    }

    // Update comment
    const { data, error } = await supabase
      .from("comments")
      .update({
        ...updates,
        is_edited: true,
      })
      .eq("id", commentId)
      .select(
        `
        *,
        user:profiles (
          id,
          display_name,
          avatar_url
        )
      `,
      )
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Delete comment action
export const deleteCommentAction = async (commentId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    // Verify comment ownership
    const { data: existingComment, error: verifyError } = await supabase
      .from("comments")
      .select()
      .eq("id", commentId)
      .single();

    if (verifyError || existingComment.user_id !== userData.user.id) {
      throw new Error("Permission denied");
    }

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// List comments action
export const listCommentsAction = async (
  contentType: string,
  contentId: string,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        user:profiles (
          id,
          display_name,
          avatar_url
        ),
        reactions:comment_reactions (
          reaction,
          user_id
        )
      `,
      )
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Add reaction action
export const addReactionAction = async (
  commentId: string,
  reaction: string,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("comment_reactions")
      .insert({
        comment_id: commentId,
        user_id: userData.user.id,
        reaction,
      })
      .select()
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Remove reaction action
export const removeReactionAction = async (
  commentId: string,
  reaction: string,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("comment_reactions")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userData.user.id)
      .eq("reaction", reaction);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};
