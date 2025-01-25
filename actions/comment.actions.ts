// actions/comment.actions.ts

"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import {
  CommentResponse,
  CommentWithProfile,
  CreateCommentInput,
  UpdateCommentInput,
} from "@/types/comment.types";

export const createCommentAction = async ({
  content,
  content_id,
  content_type,
}: CreateCommentInput): Promise<CommentResponse> => {
  const actionName = "createCommentAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc("create_comment_data", {
      comment_content: content,
      content_id,
      content_type,
      user_id: user.id,
    });

    conditionalLog(actionName, { data, error }, true);
    if (error) throw error;

    return getActionResponse({
      data: data as any as CommentWithProfile,
    });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const updateCommentAction = async ({
  id,
  content,
}: UpdateCommentInput): Promise<CommentResponse> => {
  const actionName = "updateCommentAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc("update_comment_data", {
      comment_id: id,
      comment_content: content,
      user_id: user.id,
    });

    conditionalLog(actionName, { data, error }, true);
    if (error) throw error;

    return getActionResponse({
      data: data as any as CommentWithProfile,
    });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
