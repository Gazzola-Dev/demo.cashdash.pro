// hooks/comment.hooks.ts

"use client";

import {
  createCommentAction,
  updateCommentAction,
} from "@/actions/comment.actions";
import { useToast } from "@/hooks/use-toast";
import { conditionalLog } from "@/lib/log.utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateComment = (contentId = "", taskSlug = "") => {
  const hookName = "useCreateComment";
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      // Invalidate both the task query and the project tasks query if available
      if (taskSlug)
        queryClient.invalidateQueries({ queryKey: ["task", taskSlug] });

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
  const { toast } = useToast();

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
