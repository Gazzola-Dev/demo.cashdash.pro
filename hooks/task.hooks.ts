"use client";

import {
  updateTaskAction,
  updateTasksOrderAction,
} from "@/actions/task.action";
import { useToast } from "@/hooks/use-toast";
import useAppData from "@/hooks/useAppData";
import { conditionalLog } from "@/lib/log.utils";
import { TaskComplete, TaskWithAssignee } from "@/types/app.types";
import { Tables } from "@/types/database.types";
import { useMutation } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Task = Tables<"tasks">;

export const useUpdateTask = () => {
  const hookName = "useUpdateTask";
  const { toast } = useToast();
  const { tasks, setTasks, task: currentTask, setTask, project } = useAppData();
  const [prevState, setPrevState] = useState<TaskWithAssignee[]>([]);
  const [prevCurrentTask, setPrevCurrentTask] = useState<TaskComplete | null>(
    null,
  );

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
      if (currentTask) {
        setPrevCurrentTask({ ...currentTask });
      }

      // Optimistically update the tasks array in the UI
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task,
      );
      setTasks(updatedTasks);

      // Optimistically update the current focused task if it's the one being updated
      if (currentTask && currentTask.id === taskId) {
        // For assignee updates, we need to handle the assignee_profile
        if ("assignee" in updates) {
          const assignee = updates.assignee;

          // Find the assignee profile from the project members if available
          let assigneeProfile = null;
          if (project && assignee) {
            const member = project.project_members?.find(
              m => m.user_id === assignee,
            );
            assigneeProfile = member?.profile || null;
          }

          setTask({
            ...currentTask,
            ...updates,
            assignee_profile: assignee ? assigneeProfile : null,
          });
        } else {
          // For other updates, just merge the updates
          setTask({
            ...currentTask,
            ...updates,
          });
        }
      }

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
      if (prevCurrentTask) {
        setTask(prevCurrentTask);
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
  const { tasks, setTasks, task: currentTask, setTask } = useAppData();
  const [prevState, setPrevState] = useState<TaskWithAssignee[]>([]);
  const [prevCurrentTask, setPrevCurrentTask] = useState<TaskComplete | null>(
    null,
  );

  const { mutate, isPending } = useMutation({
    mutationFn: async (orderedTasks: TaskWithAssignee[]) => {
      // Store current state for potential rollback
      setPrevState([...tasks]);
      if (currentTask) {
        setPrevCurrentTask({ ...currentTask });
      }

      // Optimistically update the UI
      setTasks(orderedTasks);

      // Update the current task if it exists in the ordered tasks
      if (currentTask) {
        const updatedCurrentTask = orderedTasks.find(
          t => t.id === currentTask.id,
        );
        if (updatedCurrentTask) {
          setTask({
            ...currentTask,
            ordinal_priority: updatedCurrentTask.ordinal_priority,
          });
        }
      }

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
      if (prevCurrentTask) {
        setTask(prevCurrentTask);
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

export function useTaskPage() {
  const pathname = usePathname();
  const { toast } = useToast();
  const { task, tasks, project, currentMilestone } = useAppData();

  // Check if task is new based on URL
  const isNewTask = pathname.endsWith("/new");

  // Check if there is a draft milestone
  const hasDraftMilestone = currentMilestone?.status === "draft";

  // Warning message state
  const showWarning = isNewTask && !hasDraftMilestone;

  // Get highest priority number among tasks
  const highestPriority = tasks?.length
    ? Math.max(...tasks.map(t => t.ordinal_priority))
    : 1;

  // Priority state
  const [priorityValue, setPriorityValue] = useState<number>(
    task?.ordinal_priority || Math.min(highestPriority + 1, 999),
  );

  // Update priority state when task changes
  useEffect(() => {
    if (task?.ordinal_priority) {
      setPriorityValue(task.ordinal_priority);
    }
  }, [task?.ordinal_priority]);

  // Update task priority
  const updateTaskPriorityMutation = useMutation({
    mutationFn: async (newPriority: number) => {
      if (!task?.id) return null;

      const { data, error } = await updateTaskAction(task.id, {
        ordinal_priority: newPriority,
      });

      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Priority updated",
        description: "Task priority has been successfully updated.",
      });
    },
    onError: error => {
      toast({
        title: "Failed to update priority",
        description: error.message,
        variant: "destructive",
      });
      // Revert to original value on error
      if (task?.ordinal_priority) {
        setPriorityValue(task.ordinal_priority);
      }
    },
  });

  const handlePriorityChange = (value: number) => {
    // Validate bounds
    const validValue = Math.max(1, Math.min(value, highestPriority));
    setPriorityValue(validValue);

    // Only update if the task exists (not a new task)
    if (task?.id) {
      updateTaskPriorityMutation.mutate(validValue);
    }
  };

  return {
    isNewTask,
    hasDraftMilestone,
    showWarning,
    priorityValue,
    highestPriority,
    handlePriorityChange,
    isPriorityUpdating: updateTaskPriorityMutation.isPending,
  };
}
