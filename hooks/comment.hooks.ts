"use client";

import { createCommentAction } from "@/actions/comment.actions";
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
      conditionalLog(hookName, { data, error }, false, null);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task"] });
      toast({
        title: "Comment added successfully",
      });
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false, null);
      toast({
        title: error.message,
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });
};
