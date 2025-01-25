// hooks/comment.hooks.ts

"use client";

import {
  createCommentAction,
  updateCommentAction,
} from "@/actions/comment.actions";
import { conditionalLog } from "@/lib/log.utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastQueue } from "./useToastQueue";

export const useCreateComment = (contentId = "") => {
  const hookName = "useCreateComment";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!contentId) throw new Error("Content ID is required");
      const { data, error } = await createCommentAction({
        content,
        content_id: contentId,
        content_type: "task",
      });
      conditionalLog(hookName, { data, error }, false);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task"] });
      toast({
        title: "Comment added successfully",
      });
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false);
      toast({
        title: error.message,
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateComment = () => {
  const hookName = "useUpdateComment";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data, error } = await updateCommentAction({ id, content });
      conditionalLog(hookName, { data, error }, false);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task"] });
      toast({
        title: "Comment updated successfully",
      });
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false);
      toast({
        title: error.message,
        description: "Failed to update comment",
        variant: "destructive",
      });
    },
  });
};
