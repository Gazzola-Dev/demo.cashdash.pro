// types/comment.types.ts

import { ActionResponse } from "@/types/action.types";
import { Tables } from "@/types/database.types";

export type Comment = Tables<"comments">;
export type Profile = Tables<"profiles">;

export interface CommentWithProfile extends Comment {
  user: Profile;
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
