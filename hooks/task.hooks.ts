"use client";

import {
  createTaskAction,
  updateTaskAction,
  updateTasksOrderAction,
} from "@/actions/task.action";
import { useToast } from "@/hooks/use-toast";
import { conditionalLog } from "@/lib/log.utils";
import { useAppData } from "@/stores/app.store";
import { TaskComplete, TaskWithAssignee } from "@/types/app.types";
import { Tables } from "@/types/database.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Task = Tables<"tasks">;

export const useUpdateTask = () => {
  const hookName = "useUpdateTask";
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
    onSuccess: data => {
      // Invalidate relevant queries to ensure data consistency
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ["task", data.id] });
      }

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
  const queryClient = useQueryClient();
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
      // Invalidate relevant queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["appData"] });

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

export const useCreateTask = () => {
  const hookName = "useCreateTask";
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { project, milestone, tasks, setTasks } = useAppData();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!project?.id) {
        throw new Error("No project selected");
      }

      const milestoneId = milestone?.id || null;

      // Call the server action to create the task
      const { data, error } = await createTaskAction(project.id, milestoneId);
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data;
    },
    onMutate: () => {
      // Optimistically add a temporary task to the UI
      if (project) {
        const tempId = `temp-${Date.now()}`;
        const nextOrdinalId =
          tasks.length > 0 ? Math.max(...tasks.map(t => t.ordinal_id)) + 1 : 1;
        const nextPriority =
          tasks.length > 0
            ? Math.max(...tasks.map(t => t.ordinal_priority)) + 1
            : 1;

        const tempTask: TaskWithAssignee = {
          id: tempId,
          title: "New Task",
          description: "",
          project_id: project.id,
          prefix: project.prefix || "TASK",
          slug: `${project.id.substring(0, 8)}-${(project.prefix || "TASK").toLowerCase()}-${nextOrdinalId}`,
          ordinal_id: nextOrdinalId,
          ordinal_priority: nextPriority,
          status: "draft",
          priority: "medium",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assignee: null,
          assignee_profile: null,
          budget_cents: null,
          estimated_minutes: null,
          recorded_minutes: null,
          start_time: null,
        };

        // Update tasks in the app store
        setTasks([...tasks, tempTask]);

        return { tempId };
      }
      return {};
    },
    onSuccess: (data, _, context) => {
      if (data) {
        // Update the tasks list by replacing the temporary task with the real one
        if (context?.tempId) {
          setTasks(
            tasks.map(t =>
              t.id === context.tempId
                ? ({ ...data, assignee_profile: null } as TaskWithAssignee)
                : t,
            ),
          );
        }

        // Invalidate relevant queries to ensure data consistency
        queryClient.invalidateQueries({ queryKey: ["appData"] });
        if (milestone?.id) {
          queryClient.invalidateQueries({
            queryKey: ["projectMilestones", project?.slug],
          });
        }

        toast({
          title: "Task Created",
          description: "New task has been created successfully.",
        });
      }
    },
    onError: error => {
      // Remove the temporary task on error
      if (tasks.find(t => t.id.startsWith("temp-"))) {
        setTasks(tasks.filter(t => !t.id.startsWith("temp-")));
      }

      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createTask = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    createTask,
    isPending,
  };
};

// Separate mutation for task priority updates
export const useUpdateTaskPriority = () => {
  const { toast } = useToast();
  const { task } = useAppData();

  return useMutation({
    mutationFn: async (newPriority: number) => {
      if (!task?.id) throw new Error("No task selected");

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
    },
  });
};

export function useTaskPage() {
  const pathname = usePathname();
  const { task, tasks, project, milestone } = useAppData();

  // Check if task is new based on URL
  const isNewTask = pathname.endsWith("/new");

  // Check if there is a draft milestone
  const hasDraftMilestone = milestone?.status === "draft";

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

  // Use the specialized task priority mutation
  const updateTaskPriorityMutation = useUpdateTaskPriority();

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
