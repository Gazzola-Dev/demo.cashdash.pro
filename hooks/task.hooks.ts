"use client";
import {
  createSubtaskAction,
  createTaskAction,
  deleteTaskAction,
  getTaskAction,
  listTasksAction,
  reorderTasksAction,
  updateTaskAction,
} from "@/actions/task.actions";
import { conditionalLog, getErrorMessage, minifyForLog } from "@/lib/log.utils";
import { TablesInsert } from "@/types/database.types";
import { HookOptions } from "@/types/db.types";
import {
  SubtaskInput,
  TaskFilters,
  TaskResult,
  TaskUpdateWithSubtasks,
} from "@/types/task.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastQueue } from "./useToastQueue";

enum SuccessMessages {
  CREATE = "Task created successfully",
  UPDATE = "Task updated successfully",
  DELETE = "Task deleted successfully",
  REORDER = "Tasks reordered successfully",
}

// Get task hook
export const useGetTask = (
  taskSlug: string,
  { initialData }: { initialData?: TaskResult } = {},
) => {
  const hookName = "useGetTask";

  return useQuery({
    queryKey: ["task", taskSlug],
    queryFn: async () => {
      const { data, error } = await getTaskAction(taskSlug);
      conditionalLog(hookName, { data, error }, false, null);
      if (!data) throw new Error("Task not found");
      return data;
    },
    initialData,
  });
};

// List tasks hook
export const useListTasks = (filters?: TaskFilters) => {
  const hookName = "useListTasks";

  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      const { data, error } = await listTasksAction(filters);
      conditionalLog(hookName, { data, error });
      return data || [];
    },
  });
};

// Create task hook
export const useCreateTask = ({
  errorMessage,
  successMessage,
}: HookOptions<TaskResult> = {}) => {
  const hookName = "useCreateTask";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (task: TablesInsert<"tasks">) => {
      const { data, error } = await createTaskAction(task);
      conditionalLog(hookName, { data, error });
      return data;
    },
    onSuccess: data => {
      conditionalLog(hookName, { success: data });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: successMessage || SuccessMessages.CREATE,
      });
    },
    onError: (error: Error) => {
      const minifiedError = minifyForLog(error);
      conditionalLog(hookName, { error: minifiedError });
      toast({
        title: errorMessage || getErrorMessage(minifiedError),
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });
};

// Update task hook
export const useUpdateTask = ({
  errorMessage,
  successMessage,
}: HookOptions<TaskResult> = {}) => {
  const hookName = "useUpdateTask";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      slug,
      updates,
    }: {
      slug: string;
      updates: TaskUpdateWithSubtasks;
    }) => {
      const { data, error } = await updateTaskAction(slug, updates);
      conditionalLog(hookName, { data, error }, false, null);
      return data;
    },
    onSuccess: data => {
      conditionalLog(hookName, { success: data }, false, null);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["task", data.task.slug] });
      }
      toast({
        title: successMessage || SuccessMessages.UPDATE,
      });
    },
    onError: (error: Error) => {
      const minifiedError = minifyForLog(error);
      conditionalLog(hookName, { error: minifiedError }, false);
      toast({
        title: errorMessage || getErrorMessage(minifiedError),
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });
};

// Delete task hook
export const useDeleteTask = ({
  errorMessage,
  successMessage,
}: HookOptions<TaskResult> = {}) => {
  const hookName = "useDeleteTask";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (taskSlug: string) => {
      const { data, error } = await deleteTaskAction(taskSlug);
      conditionalLog(hookName, { data, error });
      return data;
    },
    onSuccess: data => {
      conditionalLog(hookName, { success: data });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: successMessage || SuccessMessages.DELETE,
      });
    },
    onError: (error: Error) => {
      const minifiedError = minifyForLog(error);
      conditionalLog(hookName, { error: minifiedError });
      toast({
        title: errorMessage || getErrorMessage(minifiedError),
        description: "Failed to delete task",
        variant: "destructive",
      });
    },
  });
};

// Reorder tasks hook
export const useReorderTasks = ({
  errorMessage,
  successMessage,
}: HookOptions<TaskResult> = {}) => {
  const hookName = "useReorderTasks";
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
      const { data, error } = await reorderTasksAction(projectId, taskIds);
      conditionalLog(hookName, { data, error });
      return data;
    },
    onSuccess: data => {
      conditionalLog(hookName, { success: data });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: successMessage || SuccessMessages.REORDER,
      });
    },
    onError: (error: Error) => {
      const minifiedError = minifyForLog(error);
      conditionalLog(hookName, { error: minifiedError });
      toast({
        title: errorMessage || getErrorMessage(minifiedError),
        description: "Failed to reorder tasks",
        variant: "destructive",
      });
    },
  });
};

export const useCreateSubtask = ({
  errorMessage,
  successMessage,
}: HookOptions<TaskResult> = {}) => {
  const hookName = "useCreateSubtask";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (subtask: SubtaskInput) => {
      const { data, error } = await createSubtaskAction(subtask);
      conditionalLog(hookName, { data, error });
      return data;
    },
    onSuccess: data => {
      conditionalLog(hookName, { success: data });
      queryClient.invalidateQueries({ queryKey: ["task"] });
      toast({
        title: successMessage || "Subtask created successfully",
      });
    },
    onError: (error: Error) => {
      const minifiedError = minifyForLog(error);
      conditionalLog(hookName, { error: minifiedError });
      toast({
        title: errorMessage || getErrorMessage(minifiedError),
        description: "Failed to create subtask",
        variant: "destructive",
      });
    },
  });
};
