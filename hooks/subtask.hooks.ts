// subtask.hooks.ts
"use client";

import {
  createSubtaskAction,
  deleteSubtaskAction,
  listSubtasksAction,
  reorderSubtasksAction,
  updateSubtaskAction,
} from "@/actions/subtask.actions";
import { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { HookOptions } from "@/types/db.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastQueue } from "./useToastQueue";

type Subtask = Tables<"subtasks">;

enum SuccessMessages {
  CREATE = "Subtask created successfully",
  UPDATE = "Subtask updated successfully",
  DELETE = "Subtask deleted successfully",
  REORDER = "Subtasks reordered successfully",
}

// List subtasks hook
export const useListSubtasks = (
  taskId: string,
  filters?: {
    status?: string;
    sort?: string;
    order?: "asc" | "desc";
  },
) => {
  return useQuery({
    queryKey: ["subtasks", taskId, filters],
    queryFn: async () => {
      const { data } = await listSubtasksAction(taskId, filters);
      return data || [];
    },
  });
};

// Create subtask hook
export const useCreateSubtask = ({
  errorMessage,
  successMessage,
}: HookOptions<Subtask> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (subtask: TablesInsert<"subtasks">) => {
      const { data } = await createSubtaskAction(subtask);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["subtasks"] });
      toast({
        title: successMessage || SuccessMessages.CREATE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to create subtask",
      });
    },
  });
};

// Update subtask hook
export const useUpdateSubtask = ({
  errorMessage,
  successMessage,
}: HookOptions<Subtask> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: TablesUpdate<"subtasks">;
    }) => {
      const { data } = await updateSubtaskAction(id, updates);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["subtasks"] });
      toast({
        title: successMessage || SuccessMessages.UPDATE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to update subtask",
      });
    },
  });
};

// Delete subtask hook
export const useDeleteSubtask = ({
  errorMessage,
  successMessage,
}: HookOptions<Subtask> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (subtaskId: string) => {
      const { data } = await deleteSubtaskAction(subtaskId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks"] });
      toast({
        title: successMessage || SuccessMessages.DELETE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to delete subtask",
      });
    },
  });
};

// Reorder subtasks hook
export const useReorderSubtasks = ({
  errorMessage,
  successMessage,
}: HookOptions<Subtask> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      taskId,
      subtaskIds,
    }: {
      taskId: string;
      subtaskIds: string[];
    }) => {
      const { data } = await reorderSubtasksAction(taskId, subtaskIds);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks"] });
      toast({
        title: successMessage || SuccessMessages.REORDER,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to reorder subtasks",
      });
    },
  });
};
