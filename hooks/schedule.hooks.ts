// schedule.hooks.ts
"use client";

import {
  deleteScheduleAction,
  getScheduleAction,
  listSchedulesAction,
  updateTimeTrackingAction,
  upsertScheduleAction,
} from "@/actions/schedule.actions";
import { Tables, TablesInsert } from "@/types/database.types";
import { HookOptions } from "@/types/db.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastQueue } from "./useToastQueue";

type TaskSchedule = Tables<"task_schedule">;

enum SuccessMessages {
  UPSERT = "Schedule updated successfully",
  DELETE = "Schedule deleted successfully",
  TIME_TRACKING = "Time tracking updated successfully",
}

// Get schedule hook
export const useGetSchedule = (
  taskId: string,
  { initialData }: HookOptions<TaskSchedule> = {},
) => {
  return useQuery({
    queryKey: ["schedule", taskId],
    queryFn: async () => {
      const { data } = await getScheduleAction(taskId);
      return data;
    },
    initialData,
  });
};

// List schedules hook
export const useListSchedules = (
  projectId: string,
  startDate?: string,
  endDate?: string,
) => {
  return useQuery({
    queryKey: ["schedules", projectId, startDate, endDate],
    queryFn: async () => {
      const { data } = await listSchedulesAction(projectId, startDate, endDate);
      return data || [];
    },
  });
};

// Upsert schedule hook
export const useUpsertSchedule = ({
  errorMessage,
  successMessage,
}: HookOptions<TaskSchedule> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      taskId,
      schedule,
    }: {
      taskId: string;
      schedule: Omit<TablesInsert<"task_schedule">, "task_id">;
    }) => {
      const { data } = await upsertScheduleAction(taskId, schedule);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["schedule", data?.task_id] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast({
        title: successMessage || SuccessMessages.UPSERT,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to update schedule",
      });
    },
  });
};

// Delete schedule hook
export const useDeleteSchedule = ({
  errorMessage,
  successMessage,
}: HookOptions<TaskSchedule> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await deleteScheduleAction(taskId);
      return data;
    },
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ["schedule", taskId] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast({
        title: successMessage || SuccessMessages.DELETE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to delete schedule",
      });
    },
  });
};

// Update time tracking hook
export const useUpdateTimeTracking = ({
  errorMessage,
  successMessage,
}: HookOptions<TaskSchedule> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: {
        actual_hours?: number;
        completed_at?: string | null;
      };
    }) => {
      const { data } = await updateTimeTrackingAction(taskId, updates);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["schedule", data?.task_id] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast({
        title: successMessage || SuccessMessages.TIME_TRACKING,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to update time tracking",
      });
    },
  });
};
