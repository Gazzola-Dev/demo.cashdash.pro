import configuration from "@/configuration";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/stores/app.store";
import { TaskComplete, TaskWithAssignee } from "@/types/app.types";
import { Database, Tables } from "@/types/database.types";
import { OnDragEndResponder } from "@hello-pangea/dnd";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

// Define task types
type Task = Tables<"tasks">;
type TaskStatus = Database["public"]["Enums"]["task_status"];

// Define statuses for filtering
const allStatuses: TaskStatus[] = [
  "todo",
  "in_progress",
  "in_review",
  "completed",
  "backlog",
];

// Default visible statuses (exclude "completed" and "backlog")
const defaultStatuses: TaskStatus[] = ["todo", "in_progress", "in_review"];

export const useUpdateTask = () => {
  const { toast } = useToast();
  const { tasks, setTasks, task: currentTask, setTask, project } = useAppData();
  const [prevState, setPrevState] = useState<TaskWithAssignee[]>([]);
  const [prevCurrentTask, setPrevCurrentTask] =
    useState<Partial<TaskComplete> | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);

  const updateTask = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      if (!taskId) return null;

      setIsPending(true);
      try {
        // Store current state for potential rollback
        setPrevState([...tasks] as TaskWithAssignee[]);
        if (currentTask) {
          setPrevCurrentTask({ ...currentTask });
        }

        // Find the task to update
        const taskToUpdate = tasks.find(task => task.id === taskId);
        if (!taskToUpdate) {
          throw new Error(`Task with ID ${taskId} not found`);
        }

        // For assignee updates, we need to handle the assignee_profile
        let assigneeProfile = null;
        if ("assignee" in updates && updates.assignee) {
          // Find the assignee profile from the project members if available
          if (project) {
            const member = project.project_members?.find(
              m => m.user_id === updates.assignee,
            );
            assigneeProfile = member?.profile || null;
          }
        }

        // Create the updated task
        const updatedTask = {
          ...taskToUpdate,
          ...updates,
          updated_at: new Date().toISOString(),
          // If assignee is being updated, also update the assignee_profile
          ...("assignee" in updates
            ? {
                assignee_profile: updates.assignee ? assigneeProfile : null,
              }
            : {}),
        };

        // If this is the current focused task, use setTask to update it
        // Our enhanced store will also update it in the tasks collection
        if (currentTask && currentTask.id === taskId) {
          setTask({
            ...currentTask,
            ...updatedTask,
          });
        } else {
          // Otherwise just update the task in the tasks collection
          setTask(updatedTask);
        }

        toast({
          title: "Task updated",
          description: "Task has been successfully updated.",
        });

        return true;
      } catch (error) {
        console.error("Error updating task:", error);
        // Restore previous state on error
        if (prevState.length > 0) {
          setTasks(prevState);
        }
        if (prevCurrentTask) {
          setTask(prevCurrentTask);
        }
        toast({
          title: "Failed to update task",
          description: "An error occurred while updating the task.",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [
      currentTask,
      prevCurrentTask,
      prevState,
      project,
      setTask,
      setTasks,
      tasks,
      toast,
    ],
  );

  return {
    updateTask,
    isPending,
  };
};

/**
 * Hook to update task order
 */
export const useUpdateTasksOrder = () => {
  const { toast } = useToast();
  const { tasks, setTasks, task: currentTask, setTask } = useAppData();
  const [prevState, setPrevState] = useState<TaskWithAssignee[]>([]);
  const [prevCurrentTask, setPrevCurrentTask] =
    useState<Partial<TaskComplete> | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);

  const updateTasksOrder = useCallback(
    (orderedTasks: Partial<TaskWithAssignee>[]) => {
      setIsPending(true);
      try {
        // Store current state for potential rollback
        setPrevState([...tasks] as TaskWithAssignee[]);
        if (currentTask) {
          setPrevCurrentTask({ ...currentTask });
        }

        // Ensure all tasks have assignee_profile property defined properly
        const validOrderedTasks = orderedTasks.map(task => ({
          ...task,
          assignee_profile: task.assignee_profile || null,
        })) as TaskWithAssignee[];

        // Update tasks collection first
        setTasks(validOrderedTasks);

        // Update the current task if it exists in the ordered tasks
        if (currentTask) {
          const updatedCurrentTask = validOrderedTasks.find(
            t => t.id === currentTask.id,
          );
          if (updatedCurrentTask) {
            // setTask will also update this task in the tasks collection
            setTask({
              ...currentTask,
              ordinal_priority: updatedCurrentTask.ordinal_priority,
            });
          }
        }

        toast({
          title: "Task order updated",
          description: "Task priorities have been successfully updated.",
        });

        return true;
      } catch (error) {
        console.error("Error updating task order:", error);
        // Restore previous state on error
        if (prevState.length > 0) {
          setTasks(prevState);
        }
        if (prevCurrentTask) {
          setTask(prevCurrentTask);
        }
        toast({
          title: "Failed to update task order",
          description: "An error occurred while updating task order.",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [currentTask, prevCurrentTask, prevState, setTask, setTasks, tasks, toast],
  );

  return {
    updateTasksOrder,
    isPending,
  };
};

/**
 * Hook for task priority updates
 */
// In tasks.hooks.ts
export const useUpdateTaskPriority = () => {
  const { toast } = useToast();
  const { task, tasks, milestone, setTask, setTasks } = useAppData();
  const { updateTasksOrder, isPending: isUpdateTasksOrderPending } =
    useUpdateTasksOrder();
  const [isPending, setIsPending] = useState<boolean>(false);

  const mutate = useCallback(
    (newPriority: number) => {
      if (!task) {
        toast({
          title: "No task selected",
          description: "Please select a task first.",
          variant: "destructive",
        });
        return;
      }

      const currentPriority = task.ordinal_priority || 1;

      setIsPending(true);
      try {
        // Only consider tasks from the same milestone
        const milestoneTasks = milestone
          ? tasks.filter(t =>
              (milestone.tasks || []).some(mt => mt.id === t.id),
            )
          : tasks;

        // Make sure the value is within bounds of the milestone's tasks
        const maxPriority = milestoneTasks.length;
        const sanitizedValue = Math.max(1, Math.min(maxPriority, newPriority));

        if (currentPriority === sanitizedValue) {
          setIsPending(false);
          return;
        }

        // Create a copy of the milestone tasks array
        const items = Array.from(milestoneTasks);

        // Get indices for reordering
        const currentIndex = items.findIndex(
          t => t.ordinal_priority === currentPriority,
        );
        const targetIndex = sanitizedValue - 1; // Convert to 0-based index

        if (currentIndex === -1) {
          setIsPending(false);
          return;
        }

        // Remove the task from its position
        const [reorderedItem] = items.splice(currentIndex, 1);

        // Insert it at the new position
        items.splice(targetIndex, 0, reorderedItem);

        // Update ordinal priorities based on new positions
        const updatedItems = items.map((item, index) => ({
          ...item,
          ordinal_priority: index + 1,
        }));

        // Update only the milestone tasks while preserving other tasks
        const allUpdatedTasks = tasks.map(
          t => updatedItems.find(ui => ui.id === t.id) || t,
        );

        // Update local state optimistically
        setTasks(allUpdatedTasks);

        // Also update the current task in state
        setTask({
          ...task,
          ordinal_priority: sanitizedValue,
        });

        // Call the hook to update the task order
        updateTasksOrder(updatedItems);

        toast({
          title: "Priority updated",
          description: "Task priority has been successfully updated.",
        });
      } catch (error) {
        console.error("Error updating task priority:", error);
        toast({
          title: "Failed to update priority",
          description: "An error occurred while updating task priority.",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    },
    [task, tasks, milestone, updateTasksOrder, setTask, setTasks, toast],
  );

  const reorderByDragDrop = useCallback(
    (sourceIndex: number, destinationIndex: number) => {
      if (sourceIndex === destinationIndex) return;

      setIsPending(true);
      try {
        // Only consider tasks from the current milestone when reordering
        const milestoneTasks = milestone
          ? tasks.filter(t =>
              (milestone.tasks || []).some(mt => mt.id === t.id),
            )
          : tasks;

        // Create a copy of the milestone tasks array
        const items = Array.from(milestoneTasks);

        // Remove the task from its position
        const [reorderedItem] = items.splice(sourceIndex, 1);

        // Insert it at the new position
        items.splice(destinationIndex, 0, reorderedItem);

        // Update ordinal priorities based on new positions
        const updatedItems = items.map((item, index) => ({
          ...item,
          ordinal_priority: index + 1,
        }));

        // Merge updated milestone tasks with the rest of the tasks
        const allUpdatedTasks = tasks.map(
          t => updatedItems.find(ui => ui.id === t.id) || t,
        );

        // Update local state optimistically
        setTasks(allUpdatedTasks);

        // If the current task is affected, update its priority too
        if (
          task &&
          (task.id === reorderedItem.id ||
            milestoneTasks.some(t => t.id === task.id))
        ) {
          const updatedTask = updatedItems.find(t => t.id === task.id);
          if (updatedTask) {
            setTask({
              ...task,
              ordinal_priority: updatedTask.ordinal_priority,
            });
          }
        }

        // Call the hook to update the task order, but only for the milestone tasks
        updateTasksOrder(updatedItems);

        toast({
          title: "Task order updated",
          description: "Task order has been successfully updated.",
        });
      } catch (error) {
        console.error("Error reordering tasks:", error);
        toast({
          title: "Failed to reorder tasks",
          description: "An error occurred while reordering tasks.",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    },
    [task, tasks, milestone, updateTasksOrder, setTask, setTasks, toast],
  );

  return {
    mutate,
    reorderByDragDrop,
    isPending: isPending || isUpdateTasksOrderPending,
  };
};

/**
 * Hook for managing task list card functionality
 */
export function useTaskListCard() {
  const { project, tasks, setTasks } = useAppData();
  const isMobile = useIsMobile();
  const { updateTask, isPending: isUpdateTaskPending } = useUpdateTask();
  const { isPending: isUpdateTasksOrderPending } = useUpdateTasksOrder();
  const { reorderByDragDrop, isPending: isPriorityUpdating } =
    useUpdateTaskPriority();

  // Search and filtering states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [ordinalSearch, setOrdinalSearch] = useState<string>("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isAssigneePopoverOpen, setIsAssigneePopoverOpen] =
    useState<boolean>(false);

  // Sorting and filtering states
  const [prioritySortAscending, setPrioritySortAscending] =
    useState<boolean>(true);
  const [idLimitCycle, setIdLimitCycle] = useState<number>(0); // 0: All, 1: 5, 2: 10, 3: 20
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);

  // Get project members
  const members = useMemo(
    () => project?.project_members || [],
    [project?.project_members],
  );

  // Define ID limit based on cycle
  const getIdLimit = useCallback((): number | null => {
    switch (idLimitCycle) {
      case 1:
        return 5;
      case 2:
        return 10;
      case 3:
        return 20;
      default:
        return null; // No limit
    }
  }, [idLimitCycle]);

  // Filter tasks based on search, assignees, and status
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Match title and ordinal ID
      const titleMatch =
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
      const ordinalMatch = ordinalSearch
        ? (task.ordinal_id?.toString().includes(ordinalSearch) ?? false)
        : true;

      // Match assignee
      const assigneeMatch =
        selectedAssignees.length === 0
          ? true
          : selectedAssignees.includes(task.assignee || "");

      // Match status based on selection
      const statusMatch = selectedStatus
        ? task.status === selectedStatus
        : defaultStatuses.includes(task.status as TaskStatus);

      return titleMatch && ordinalMatch && assigneeMatch && statusMatch;
    });
  }, [tasks, searchQuery, ordinalSearch, selectedAssignees, selectedStatus]);

  // Sort tasks based on priority
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (prioritySortAscending) {
        return (a.ordinal_priority || 0) - (b.ordinal_priority || 0);
      } else {
        return (b.ordinal_priority || 0) - (a.ordinal_priority || 0);
      }
    });
  }, [filteredTasks, prioritySortAscending]);

  // Apply ID limit if needed
  const limitedTasks = useMemo(() => {
    const limit = getIdLimit();
    return limit ? sortedTasks.slice(0, limit) : sortedTasks;
  }, [sortedTasks, getIdLimit]);

  // Handle drag and drop functionality
  const handleDragEnd: OnDragEndResponder = useCallback(
    result => {
      if (!result.destination || !result.source) return;
      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;

      // Reorder tasks using the reorderByDragDrop function

      reorderByDragDrop(sourceIndex, destinationIndex);
    },
    [reorderByDragDrop],
  );

  // Handle status change for a task
  const handleStatusChange = useCallback(
    (taskId: string, newStatus: string): void => {
      updateTask(taskId, { status: newStatus as TaskStatus });
    },
    [updateTask],
  );

  // Handle assignee change for a task
  // Replace the handleAssigneeChange function in useTaskListCard
  const handleAssigneeChange = useCallback(
    (taskId: string, newAssigneeId: string | null): void => {
      // First update the database
      updateTask(taskId, { assignee: newAssigneeId });

      // Also update the tasks array in the app store directly
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          // Find the member profile for the assignee
          let assigneeProfile = null;
          if (newAssigneeId) {
            const member = members.find(m => m.user_id === newAssigneeId);
            assigneeProfile = member?.profile || null;
          }

          return {
            ...task,
            assignee: newAssigneeId,
            assignee_profile: assigneeProfile,
          };
        }
        return task;
      });

      // Update the tasks in the app store
      setTasks(updatedTasks);
    },
    [tasks, members, updateTask, setTasks],
  );

  // Toggle assignee selection for filtering
  const toggleAssignee = useCallback((userId: string): void => {
    setSelectedAssignees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId],
    );
  }, []);

  // Get text to display for selected assignees
  const getSelectedAssigneesDisplayText = useCallback((): string => {
    if (selectedAssignees.length === 0) return "Assignee";
    if (selectedAssignees.length === 1) {
      const member = members.find(m => m.user_id === selectedAssignees[0]);
      return member?.profile?.display_name || "Unknown";
    }
    return `${selectedAssignees.length} assignees`;
  }, [selectedAssignees, members]);

  // Create a new task
  const createNewTask = useCallback((): void => {
    if (project?.slug) {
      window.location.href = configuration.paths.tasks.new({
        project_slug: project.slug,
      });
    }
  }, [project]);

  // Handlers for header clicks
  const handlePriorityHeaderClick = useCallback((): void => {
    setPrioritySortAscending(!prioritySortAscending);
  }, [prioritySortAscending]);

  const handleIdHeaderClick = useCallback((): void => {
    setIdLimitCycle((idLimitCycle + 1) % 4);
  }, [idLimitCycle]);

  // Status header click handler with cycling
  const handleStatusHeaderClick = useCallback((): void => {
    if (selectedStatus === null) {
      // If no status is selected, select the first one from all statuses
      setSelectedStatus(allStatuses[0]);
    } else {
      // Find the current status index in all statuses
      const currentIndex = allStatuses.indexOf(selectedStatus);

      // Determine the next index, cycling back to null after the last status
      const nextIndex = (currentIndex + 1) % (allStatuses.length + 1);

      // Set the next status, or null if we've cycled through all
      setSelectedStatus(
        nextIndex === allStatuses.length ? null : allStatuses[nextIndex],
      );
    }
  }, [selectedStatus]);

  // Get display text for ID header
  const getIdHeaderText = useCallback((): string => {
    const limit = getIdLimit();
    return limit ? `ID (${limit})` : "ID";
  }, [getIdLimit]);

  return {
    // State
    project,
    tasks,
    isMobile,
    searchQuery,
    setSearchQuery,
    ordinalSearch,
    setOrdinalSearch,
    selectedAssignees,
    isAssigneePopoverOpen,
    setIsAssigneePopoverOpen,
    prioritySortAscending,
    members,
    limitedTasks,
    selectedStatus,
    isPending:
      isUpdateTaskPending || isUpdateTasksOrderPending || isPriorityUpdating,

    // Actions
    handleDragEnd,
    handleStatusChange,
    handleAssigneeChange,
    toggleAssignee,
    getSelectedAssigneesDisplayText,
    createNewTask,
    handlePriorityHeaderClick,
    handleIdHeaderClick,
    handleStatusHeaderClick,
    getIdHeaderText,
    setTasks,
  };
}

/**
 * Hook to create a task
 */
export const useCreateTask = () => {
  const { toast } = useToast();
  const { project, milestone, tasks, setTasks } = useAppData();
  const [isPending, setIsPending] = useState(false);

  const createTask = useCallback(() => {
    if (!project?.id) {
      toast({
        title: "No project selected",
        description: "Please select a project first.",
        variant: "destructive",
      });
      return null;
    }

    setIsPending(true);
    try {
      const milestoneId = milestone?.id || null;
      const nextOrdinalId =
        tasks.length > 0
          ? Math.max(...tasks.map(t => t.ordinal_id || 0)) + 1
          : 1;
      const nextPriority =
        tasks.length > 0
          ? Math.max(...tasks.map(t => t.ordinal_priority || 0)) + 1
          : 1;

      // Create new task
      const newTask: TaskWithAssignee = {
        id: `task-${Date.now()}`,
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
      setTasks([...tasks, newTask]);

      toast({
        title: "Task Created",
        description: "New task has been created successfully.",
      });

      return newTask;
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Failed to create task",
        description: "An error occurred while creating the task.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsPending(false);
    }
  }, [project, milestone, tasks, setTasks, toast]);

  return {
    createTask,
    isPending,
  };
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
    ? Math.max(...tasks.map(t => t.ordinal_priority || 0))
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

/**
 * Hook to delete a task
 */
export const useDeleteTask = () => {
  const { toast } = useToast();
  const { tasks, setTasks, task: currentTask, setTask } = useAppData();
  const [prevState, setPrevState] = useState<Partial<TaskWithAssignee>[]>([]);
  const [isPending, setIsPending] = useState(false);

  const deleteTask = useCallback(
    (taskId: string) => {
      if (!taskId) return false;

      setIsPending(true);
      try {
        // Store current state for potential rollback
        setPrevState([...tasks]);

        // Optimistically update the tasks array in the UI by removing the task
        const updatedTasks = tasks.filter(task => task.id !== taskId);
        setTasks(updatedTasks);

        // If the current task is the one being deleted, clear it
        if (currentTask && currentTask.id === taskId) {
          setTask(null);
        }

        toast({
          title: "Task deleted",
          description: "Task has been successfully deleted.",
        });

        return true;
      } catch (error) {
        console.error("Error deleting task:", error);
        // Restore previous state on error
        if (prevState.length > 0) {
          setTasks(prevState);
        }

        toast({
          title: "Failed to delete task",
          description: "An error occurred while deleting the task.",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [currentTask, prevState, setTask, setTasks, tasks, toast],
  );

  return {
    deleteTask,
    isPending,
  };
};

/**
 * Hook to update task order specifically for drag and drop operations
 */
export const useTaskDragDrop = () => {
  const { toast } = useToast();
  const {
    tasks,
    setTasks,
    task: currentTask,
    setTask,
    milestone,
  } = useAppData();
  const [prevState, setPrevState] = useState<TaskWithAssignee[]>([]);
  const [prevCurrentTask, setPrevCurrentTask] =
    useState<Partial<TaskComplete> | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);

  /**
   * Updates the task order based on a drag and drop operation
   */
  const handleDragEnd = useCallback<OnDragEndResponder>(
    result => {
      // Return early if there's no destination or if the item is dropped in the same position
      if (
        !result.destination ||
        result.source.index === result.destination.index
      ) {
        return;
      }

      setIsPending(true);
      try {
        // Store current state for potential rollback
        setPrevState([...tasks] as TaskWithAssignee[]);
        if (currentTask) {
          setPrevCurrentTask({ ...currentTask });
        }

        // Get the source and destination indices from the drag event
        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        // Get the tasks that should be considered for reordering
        // Either all tasks or only the tasks in the current milestone
        const relevantTasks = (
          milestone
            ? tasks.filter(t =>
                (milestone.tasks || []).some(mt => mt.id === t.id),
              )
            : [...tasks]
        ).filter(
          task =>
            task.status !== "completed" &&
            task.status !== "backlog" &&
            task.status !== "draft",
        );

        console.log(relevantTasks);

        // Sort the relevant tasks by their current ordinal_priority
        const sortedTasks = [...relevantTasks].sort(
          (a, b) => (a.ordinal_priority || 0) - (b.ordinal_priority || 0),
        );

        // Extract the task being moved
        const taskToMove = sortedTasks[sourceIndex];

        if (!taskToMove) {
          throw new Error("Task not found at source index");
        }

        // Remove the task from the array
        sortedTasks.splice(sourceIndex, 1);

        // Insert it at the new position
        sortedTasks.splice(destinationIndex, 0, taskToMove);

        console.log(taskToMove.title, destinationIndex);

        // Update ordinal priorities for all affected tasks
        const updatedTasks = sortedTasks.map((task, index) => ({
          ...task,
          ordinal_priority: index + 1,
        }));

        // Create a map of task IDs to updated tasks for efficient lookup
        const updatedTasksMap = new Map(
          updatedTasks.map(task => [task.id, task]),
        );

        // Update all tasks with their new ordinal_priority values
        const allUpdatedTasks = tasks.map(task => {
          const updatedTask = updatedTasksMap.get(task.id);
          return updatedTask || task;
        });

        // Update tasks in state
        setTasks(allUpdatedTasks);

        // If the current task was affected, update it too
        if (currentTask && updatedTasksMap.has(currentTask.id)) {
          const updatedCurrentTask = updatedTasksMap.get(currentTask.id);
          if (updatedCurrentTask) {
            setTask({
              ...currentTask,
              ordinal_priority: updatedCurrentTask.ordinal_priority,
            });
          }
        }

        toast({
          title: "Task order updated",
          description: "Task priorities have been successfully updated.",
        });

        return true;
      } catch (error) {
        console.error("Error updating task order:", error);
        // Restore previous state on error
        if (prevState.length > 0) {
          setTasks(prevState);
        }
        if (prevCurrentTask) {
          setTask(prevCurrentTask);
        }
        toast({
          title: "Failed to update task order",
          description: "An error occurred while updating task order.",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [
      currentTask,
      milestone,
      prevCurrentTask,
      prevState,
      setTask,
      setTasks,
      tasks,
      toast,
    ],
  );

  return {
    handleDragEnd,
    isPending,
  };
};

/**
 * Enhanced version of useTaskListCard that incorporates the drag and drop functionality
 */
export function useEnhancedTaskListCard() {
  const baseHook = useTaskListCard();
  const { handleDragEnd, isPending: isDragDropPending } = useTaskDragDrop();

  // Replace the original handleDragEnd with our improved version
  return {
    ...baseHook,
    handleDragEnd,
    isPending: baseHook.isPending || isDragDropPending,
  };
}
