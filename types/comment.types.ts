// types/comment.types.ts
import { ActionResponse } from "@/types/action.types";
import { Tables } from "@/types/database.types";

export type Comment = Tables<"comments">;

// Only include the profile fields needed for comments
export interface CommentProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  professional_title: string | null;
}

export interface CommentWithProfile extends Comment {
  user: CommentProfile;
}

export interface CreateCommentInput {
  content: string;
  content_id: string;
  content_type: Tables<"comments">["content_type"];
}

export interface UpdateCommentInput {
  id: string;
  content: string;
}

export interface CommentResponse extends ActionResponse<CommentWithProfile> {}
export interface CommentListResponse
  extends ActionResponse<CommentWithProfile[]> {}
