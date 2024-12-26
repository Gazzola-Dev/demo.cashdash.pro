// comment.hooks.ts
"use client";

import {
  addReactionAction,
  createCommentAction,
  deleteCommentAction,
  listCommentsAction,
  removeReactionAction,
  updateCommentAction,
} from "@/actions/comment.actions";
import { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { HookOptions } from "@/types/db.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastQueue } from "./useToastQueue";

type Comment = Tables<"comments">;
type CommentReaction = Tables<"comment_reactions">;

enum SuccessMessages {
  CREATE = "Comment added successfully",
  UPDATE = "Comment updated successfully",
  DELETE = "Comment deleted successfully",
  REACTION_ADD = "Reaction added",
  REACTION_REMOVE = "Reaction removed",
}

// List comments hook
export const useListComments = (contentType: string, contentId: string) => {
  return useQuery({
    queryKey: ["comments", contentType, contentId],
    queryFn: async () => {
      const { data } = await listCommentsAction(contentType, contentId);
      return data || [];
    },
  });
};

// Create comment hook
export const useCreateComment = ({
  errorMessage,
  successMessage,
}: HookOptions<Comment> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (comment: TablesInsert<"comments">) => {
      const { data } = await createCommentAction(comment);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ["comments", data?.content_type, data?.content_id],
      });
      toast({
        title: successMessage || SuccessMessages.CREATE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to add comment",
      });
    },
  });
};

// Update comment hook
export const useUpdateComment = ({
  errorMessage,
  successMessage,
}: HookOptions<Comment> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: TablesUpdate<"comments">;
    }) => {
      const { data } = await updateCommentAction(id, updates);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ["comments", data?.content_type, data?.content_id],
      });
      toast({
        title: successMessage || SuccessMessages.UPDATE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to update comment",
      });
    },
  });
};

// Delete comment hook
export const useDeleteComment = ({
  errorMessage,
  successMessage,
}: HookOptions<Comment> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data } = await deleteCommentAction(commentId);
      return data;
    },
    onSuccess: (_, commentId) => {
      // Invalidate all comment queries since we don't have content type/id in context
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast({
        title: successMessage || SuccessMessages.DELETE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to delete comment",
      });
    },
  });
};

// Add reaction hook
export const useAddReaction = ({
  errorMessage,
  successMessage,
}: HookOptions<CommentReaction> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      commentId,
      reaction,
    }: {
      commentId: string;
      reaction: string;
    }) => {
      const { data } = await addReactionAction(commentId, reaction);
      return data;
    },
    onSuccess: () => {
      // Invalidate all comment queries since we don't have content type/id in context
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast({
        title: successMessage || SuccessMessages.REACTION_ADD,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to add reaction",
      });
    },
  });
};

// Remove reaction hook
export const useRemoveReaction = ({
  errorMessage,
  successMessage,
}: HookOptions<CommentReaction> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      commentId,
      reaction,
    }: {
      commentId: string;
      reaction: string;
    }) => {
      const { data } = await removeReactionAction(commentId, reaction);
      return data;
    },
    onSuccess: () => {
      // Invalidate all comment queries since we don't have content type/id in context
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast({
        title: successMessage || SuccessMessages.REACTION_REMOVE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to remove reaction",
      });
    },
  });
};
