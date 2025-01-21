"use client";
import {
  createTaskAction,
  deleteTaskAction,
  getTaskAction,
  listTasksAction,
  reorderTasksAction,
  updateTaskAction,
} from "@/actions/task.actions";
import { TablesInsert, TablesUpdate } from "@/types/database.types";
import { HookOptions } from "@/types/db.types";
import { TaskFilters, TaskWithDetails } from "@/types/task.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastQueue } from "./useToastQueue";

enum SuccessMessages {
  CREATE = "Task created successfully",
  UPDATE = "Task updated successfully",
  DELETE = "Task deleted successfully",
  REORDER = "Tasks reordered successfully",
}

// Get task hook - now using slug instead of ID
export const useGetTask = (
  taskSlug: string,
  { initialData }: { initialData?: TaskWithDetails } = {},
) => {
  return useQuery({
    queryKey: ["task", taskSlug],
    queryFn: async () => {
      const { data } = await getTaskAction(taskSlug);
      if (!data) throw new Error("Task not found");
      return data;
    },
    initialData,
  });
};

// List tasks hook
export const useListTasks = (filters?: TaskFilters) => {
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
}: HookOptions<TaskWithDetails> = {}) => {
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

// Update task hook - now using slug instead of ID
export const useUpdateTask = ({
  errorMessage,
  successMessage,
}: HookOptions<TaskWithDetails> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      slug,
      updates,
    }: {
      slug: string;
      updates: TablesUpdate<"tasks">;
    }) => {
      const { data } = await updateTaskAction(slug, updates);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", data?.slug] });
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

// Delete task hook - now using slug instead of ID
export const useDeleteTask = ({
  errorMessage,
  successMessage,
}: HookOptions<TaskWithDetails> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (taskSlug: string) => {
      const { data } = await deleteTaskAction(taskSlug);
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
}: HookOptions<TaskWithDetails> = {}) => {
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
