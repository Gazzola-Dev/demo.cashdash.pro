import configuration from "@/configuration";
import { useUpdateTask, useUpdateTasksOrder } from "@/hooks/task.hooks";
import { useIsMobile } from "@/hooks/use-mobile";
import useAppData from "@/hooks/useAppData";
import { Database } from "@/types/database.types";
import { OnDragEndResponder } from "@hello-pangea/dnd";
import { useState } from "react";

type TaskStatus = Database["public"]["Enums"]["task_status"];

// Task interface with all required properties
interface TaskWithAssignee {
  id: string;
  title: string;
  ordinal_id: number;
  ordinal_priority: number;
  status: TaskStatus;
  assignee: string | null;
  assignee_profile?: {
    avatar_url?: string;
    display_name?: string;
  } | null;
  budget_cents: number;
  created_at: string;
  description: string;
  estimated_minutes: number;
  // Adding other required properties
  updated_at: string;
  completed_at: string | null;
  slug: string;
  project_id: string;
  created_by: string;
  is_deleted: boolean;
}

interface ProjectMember {
  user_id: string;
  profile?: {
    display_name?: string;
    avatar_url?: string;
  } | null;
}

interface Project {
  slug: string;
  project_members?: ProjectMember[];
}

export function useTaskListCard() {
  const { project, tasks, isAdmin, setTasks } = useAppData();
  const isMobile = useIsMobile();
  const { updateTask } = useUpdateTask();
  const { updateTasksOrder } = useUpdateTasksOrder();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [ordinalSearch, setOrdinalSearch] = useState<string>("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isAssigneePopoverOpen, setIsAssigneePopoverOpen] =
    useState<boolean>(false);

  // States for sorting and filtering features
  const [prioritySortAscending, setPrioritySortAscending] =
    useState<boolean>(true);
  const [idLimitCycle, setIdLimitCycle] = useState<number>(0); // 0: All, 1: 5, 2: 10, 3: 20
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);

  const members = project?.project_members || [];

  const getIdLimit = (): number | null => {
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
  };

  // Define statuses array for cycling
  const allStatuses: TaskStatus[] = [
    "todo",
    "in_progress",
    "in_review",
    "completed",
    "backlog",
  ];

  // Define visible statuses (exclude "completed" and "backlog" by default)
  const defaultStatuses: TaskStatus[] = ["todo", "in_progress", "in_review"];

  // Filter tasks based on search queries, selected assignees, and status
  const filteredTasks = tasks.filter(task => {
    // Match title and ordinal ID
    const titleMatch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const ordinalMatch = ordinalSearch
      ? task.ordinal_id.toString().includes(ordinalSearch)
      : true;

    // Match assignee
    const assigneeMatch =
      selectedAssignees.length === 0
        ? true
        : selectedAssignees.includes(task.assignee || "");

    // Match status - if no status is selected, only show default statuses
    // Otherwise, only show the selected status
    const statusMatch = selectedStatus
      ? task.status === selectedStatus
      : defaultStatuses.includes(task.status);

    return titleMatch && ordinalMatch && assigneeMatch && statusMatch;
  });

  // Sort tasks based on priority
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (prioritySortAscending) {
      return a.ordinal_priority - b.ordinal_priority;
    } else {
      return b.ordinal_priority - a.ordinal_priority;
    }
  });

  // Apply ID limit if needed
  const limitedTasks = getIdLimit()
    ? sortedTasks.slice(0, getIdLimit() || undefined)
    : sortedTasks;

  const handleDragEnd: OnDragEndResponder = result => {
    if (!result.destination) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update ordinal priorities based on new positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      ordinal_priority: index + 1,
    }));

    // Call the hook to update the task order
    updateTasksOrder(updatedItems);
  };

  const handleStatusChange = (taskId: string, newStatus: string): void => {
    updateTask(taskId, { status: newStatus as TaskStatus });
  };

  const handleAssigneeChange = (
    taskId: string,
    newAssigneeId: string | null,
  ): void => {
    // First update the local state optimistically
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        // Find the new assignee profile if there is one
        let newAssigneeProfile = null;
        if (newAssigneeId) {
          const member = members.find(m => m.user_id === newAssigneeId);
          if (member?.profile) {
            newAssigneeProfile = member.profile;
          }
        }

        return {
          ...task,
          assignee: newAssigneeId,
          assignee_profile: newAssigneeProfile,
        };
      }
      return task;
    });

    // Update the tasks in the app store
    setTasks(updatedTasks);

    // Then call the API to persist the change
    updateTask(taskId, { assignee: newAssigneeId });
  };

  const toggleAssignee = (userId: string): void => {
    setSelectedAssignees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId],
    );
  };

  const getSelectedAssigneesDisplayText = (): string => {
    if (selectedAssignees.length === 0) return "Assignee";
    if (selectedAssignees.length === 1) {
      const member = members.find(m => m.user_id === selectedAssignees[0]);
      return member?.profile?.display_name || "Unknown";
    }
    return `${selectedAssignees.length} assignees`;
  };

  const createNewTask = (): void => {
    if (project) {
      window.location.href = configuration.paths.tasks.new({
        project_slug: project.slug,
      });
    }
  };

  // Handlers for header clicks
  const handlePriorityHeaderClick = (): void => {
    setPrioritySortAscending(!prioritySortAscending);
  };

  const handleIdHeaderClick = (): void => {
    setIdLimitCycle((idLimitCycle + 1) % 4);
  };

  // Updated status header click handler with improved cycling
  const handleStatusHeaderClick = (): void => {
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
  };

  // Get display text for ID header
  const getIdHeaderText = (): string => {
    const limit = getIdLimit();
    return limit ? `ID (${limit})` : "ID";
  };

  return {
    project,
    tasks,
    isAdmin,
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
