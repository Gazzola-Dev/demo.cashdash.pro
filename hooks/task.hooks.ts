// task.hooks.ts
"use client";

import {
  createTaskAction,
  deleteTaskAction,
  getTaskAction,
  listTasksAction,
  reorderTasksAction,
  updateTaskAction,
} from "@/actions/task.actions";
import { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { HookOptions } from "@/types/db.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastQueue } from "./useToastQueue";

type Task = Tables<"tasks">;

enum SuccessMessages {
  CREATE = "Task created successfully",
  UPDATE = "Task updated successfully",
  DELETE = "Task deleted successfully",
  REORDER = "Tasks reordered successfully",
}

// Get task hook
export const useGetTask = (
  taskId: string,
  { initialData }: HookOptions<Task> = {},
) => {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const { data } = await getTaskAction(taskId);
      if (!data) throw new Error("Task not found");
      return data;
    },
    initialData,
  });
};

// List tasks hook
export const useListTasks = (filters?: {
  projectId?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}) => {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      const { data } = await listTasksAction(filters);
      return data || [];
    },
  });
};

// Create task hook
export const useCreateTask = ({
  errorMessage,
  successMessage,
}: HookOptions<Task> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (task: TablesInsert<"tasks">) => {
      const { data } = await createTaskAction(task);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: successMessage || SuccessMessages.CREATE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to create task",
      });
    },
  });
};

// Update task hook
export const useUpdateTask = ({
  errorMessage,
  successMessage,
}: HookOptions<Task> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: TablesUpdate<"tasks">;
    }) => {
      const { data } = await updateTaskAction(id, updates);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", data?.id] });
      toast({
        title: successMessage || SuccessMessages.UPDATE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to update task",
      });
    },
  });
};

// Delete task hook
export const useDeleteTask = ({
  errorMessage,
  successMessage,
}: HookOptions<Task> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await deleteTaskAction(taskId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: successMessage || SuccessMessages.DELETE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to delete task",
      });
    },
  });
};

// Reorder tasks hook
export const useReorderTasks = ({
  errorMessage,
  successMessage,
}: HookOptions<Task> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      projectId,
      taskIds,
    }: {
      projectId: string;
      taskIds: string[];
    }) => {
      const { data } = await reorderTasksAction(projectId, taskIds);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: successMessage || SuccessMessages.REORDER,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to reorder tasks",
      });
    },
  });
};
