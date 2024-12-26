// tag.hooks.ts
"use client";

import {
  assignTagAction,
  createTagAction,
  deleteTagAction,
  listTagsAction,
  removeTagAction,
  updateTagAction,
} from "@/actions/tag.actions";
import { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { HookOptions } from "@/types/db.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastQueue } from "./useToastQueue";

type Tag = Tables<"tags">;
type TaskTag = Tables<"task_tags">;

enum SuccessMessages {
  CREATE = "Tag created successfully",
  UPDATE = "Tag updated successfully",
  DELETE = "Tag deleted successfully",
  ASSIGN = "Tag assigned successfully",
  REMOVE = "Tag removed successfully",
}

// List tags hook
export const useListTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data } = await listTagsAction();
      return data || [];
    },
  });
};

// Create tag hook
export const useCreateTag = ({
  errorMessage,
  successMessage,
}: HookOptions<Tag> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (tag: TablesInsert<"tags">) => {
      const { data } = await createTagAction(tag);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast({
        title: successMessage || SuccessMessages.CREATE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to create tag",
      });
    },
  });
};

// Update tag hook
export const useUpdateTag = ({
  errorMessage,
  successMessage,
}: HookOptions<Tag> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: TablesUpdate<"tags">;
    }) => {
      const { data } = await updateTagAction(id, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast({
        title: successMessage || SuccessMessages.UPDATE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to update tag",
      });
    },
  });
};

// Delete tag hook
export const useDeleteTag = ({
  errorMessage,
  successMessage,
}: HookOptions<Tag> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (tagId: string) => {
      const { data } = await deleteTagAction(tagId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast({
        title: successMessage || SuccessMessages.DELETE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to delete tag",
      });
    },
  });
};

// Assign tag hook
export const useAssignTag = ({
  errorMessage,
  successMessage,
}: HookOptions<TaskTag> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      taskId,
      tagId,
    }: {
      taskId: string;
      tagId: string;
    }) => {
      const { data } = await assignTagAction(taskId, tagId);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
      toast({
        title: successMessage || SuccessMessages.ASSIGN,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to assign tag",
      });
    },
  });
};

// Remove tag hook
export const useRemoveTag = ({
  errorMessage,
  successMessage,
}: HookOptions<TaskTag> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      taskId,
      tagId,
    }: {
      taskId: string;
      tagId: string;
    }) => {
      const { data } = await removeTagAction(taskId, tagId);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
      toast({
        title: successMessage || SuccessMessages.REMOVE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to remove tag",
      });
    },
  });
};
