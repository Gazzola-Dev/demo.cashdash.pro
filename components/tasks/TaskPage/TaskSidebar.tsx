"use client";
import GitBranchCopy from "@/components/tasks/GitBranchCopy";
import {
  AssigneeSelect,
  StatusSelect,
} from "@/components/tasks/TaskSelectComponents";
import { Card, CardContent } from "@/components/ui/card";
import { useUpdateTask, useUpdateTasksOrder } from "@/hooks/task.hooks";
import useAppData from "@/hooks/useAppData";
import { cn } from "@/lib/utils";
import { Tables } from "@/types/database.types";
import { Award, ChevronDown, ChevronUp } from "lucide-react";
import { useCallback } from "react";

type TaskStatus = Tables<"tasks">["status"];

// Loading Skeleton Component
const TaskSidebarSkeleton = () => {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Assignee Skeleton */}
      <div className="flex items-center justify-between">
        <div className="w-full">
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="flex items-center justify-between flex-grow">
            <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>

      {/* Status Skeleton */}
      <div>
        <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-9 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>

      {/* Priority Skeleton */}
      <div>
        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
      </div>
    </div>
  );
};

// New Priority Control Component
const PriorityControl = ({
  value,
  onChange,
  maxValue,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  maxValue: number;
  disabled: boolean;
}) => {
  const handleIncrement = useCallback(() => {
    if (value < maxValue) {
      onChange(value + 1);
    }
  }, [value, maxValue, onChange]);

  const handleDecrement = useCallback(() => {
    if (value > 1) {
      onChange(value - 1);
    }
  }, [value, onChange]);

  return (
    <div className="flex items-center space-x-2 h-9">
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-l-md px-3 py-2">
        <Award className="h-4 w-4 mr-2 text-amber-500" />
        <span className="font-medium">{value}</span>
      </div>
      <div className="flex flex-col border rounded-r-md">
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= maxValue}
          className={cn(
            "flex items-center justify-center h-4.5 px-2 rounded-tr-md",
            "border-b border-gray-200 dark:border-gray-700",
            "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
            (disabled || value >= maxValue) && "opacity-50 cursor-not-allowed",
          )}
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= 1}
          className={cn(
            "flex items-center justify-center h-4.5 px-2 rounded-br-md",
            "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
            (disabled || value <= 1) && "opacity-50 cursor-not-allowed",
          )}
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export function TaskSidebar() {
  const { project, task, tasks, user, profile, setTasks } = useAppData();
  const members = project?.project_members || [];
  const { updateTask, isPending } = useUpdateTask();
  const { updateTasksOrder } = useUpdateTasksOrder();

  // Loading state determination based on the same logic as in TaskList
  const isLoading =
    (user && !profile) ||
    (tasks.length && project?.id !== tasks?.[0]?.project_id) ||
    !task;

  const handleStatusChange = (value: TaskStatus) => {
    if (!task) return;
    updateTask(task.id, { status: value });
  };

  const handleAssigneeChange = (value: string | null) => {
    if (!task) return;
    updateTask(task.id, { assignee: value });
  };

  const handlePriorityChange = (value: number) => {
    if (!task) return;

    // Make sure the value is within bounds
    const sanitizedValue = Math.max(1, Math.min(tasks.length, value));

    // Get the current task index and target index
    const currentIndex = tasks.findIndex(t => t.id === task.id);
    const targetIndex = sanitizedValue - 1; // Convert to 0-based index

    if (currentIndex === -1 || currentIndex === targetIndex) return;

    // Create a copy of the tasks array
    const items = Array.from(tasks);

    // Remove the current task from its position
    const [reorderedItem] = items.splice(currentIndex, 1);

    // Insert it at the new position
    items.splice(targetIndex, 0, reorderedItem);

    // Update ordinal priorities based on new positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      ordinal_priority: index + 1,
    }));

    // Update local state optimistically
    setTasks(updatedItems);

    // Call the hook to update the task order
    updateTasksOrder(updatedItems);
  };

  return (
    <Card>
      <CardContent className={cn("pt-6", isLoading && "min-h-[250px]")}>
        {isLoading ? (
          <TaskSidebarSkeleton />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-full">
                <label className="text-sm font-medium">Assignee</label>
                <div className="flex items-center justify-between flex-grow">
                  <AssigneeSelect
                    value={task?.assignee || null}
                    onValueChange={handleAssigneeChange}
                    members={members}
                  />
                  <GitBranchCopy
                    taskOrdinalId={task?.ordinal_id || 0}
                    taskTitle={task?.title || ""}
                  />
                </div>
              </div>
            </div>
            {/* Status */}
            <div>
              <label className="text-sm font-medium">Status</label>
              <StatusSelect
                value={task?.status || "backlog"}
                onValueChange={handleStatusChange}
              />
            </div>
            {/* Priority - using new PriorityControl component */}
            <div>
              <label className="text-sm font-medium">Priority</label>
              <PriorityControl
                value={task?.ordinal_priority || 1}
                onChange={handlePriorityChange}
                maxValue={tasks.length}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {isPending ? "Updating..." : `${tasks.length} tasks total`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TaskSidebar;
