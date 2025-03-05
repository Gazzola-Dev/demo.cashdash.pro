"use client";

import {
  updateTaskAction,
  updateTasksOrderAction,
} from "@/actions/task.action";
import { useToast } from "@/hooks/use-toast";
import useAppData from "@/hooks/useAppData";
import { conditionalLog } from "@/lib/log.utils";
import { TaskWithAssignee } from "@/types/app.types";
import { Tables } from "@/types/database.types";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";

type Task = Tables<"tasks">;

export const useUpdateTask = () => {
  const hookName = "useUpdateTask";
  const { toast } = useToast();
  const { tasks, setTasks } = useAppData();
  const [prevState, setPrevState] = useState<TaskWithAssignee[]>([]);

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<Task>;
    }) => {
      // Store current state for potential rollback
      setPrevState([...tasks]);

      // Optimistically update the UI
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task,
      );
      setTasks(updatedTasks);

      // Make the actual API call
      const { data, error } = await updateTaskAction(taskId, updates);
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Task updated",
        description: "Task has been successfully updated.",
      });
    },
    onError: error => {
      // Restore previous state on error
      if (prevState.length > 0) {
        setTasks(prevState);
      }
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTask = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      mutate({ taskId, updates });
    },
    [mutate],
  );

  return {
    updateTask,
    isPending,
  };
};

export const useUpdateTasksOrder = () => {
  const hookName = "useUpdateTasksOrder";
  const { toast } = useToast();
  const { tasks, setTasks } = useAppData();
  const [prevState, setPrevState] = useState<TaskWithAssignee[]>([]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (orderedTasks: TaskWithAssignee[]) => {
      // Store current state for potential rollback
      setPrevState([...tasks]);

      // Optimistically update the UI
      setTasks(orderedTasks);

      // Prepare data for the server action
      const taskIds = orderedTasks.map(task => task.id);
      const priorities = orderedTasks.map(task => task.ordinal_priority);

      // Make the actual API call
      const { data, error } = await updateTasksOrderAction(taskIds, priorities);
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Task order updated",
        description: "Task priorities have been successfully updated.",
      });
    },
    onError: error => {
      // Restore previous state on error
      if (prevState.length > 0) {
        setTasks(prevState);
      }
      toast({
        title: "Failed to update task order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTasksOrder = useCallback(
    (orderedTasks: TaskWithAssignee[]) => {
      mutate(orderedTasks);
    },
    [mutate],
  );

  return {
    updateTasksOrder,
    isPending,
  };
};
