"use client";
import GitBranchCopy from "@/components/tasks/GitBranchCopy";
import {
  AssigneeSelect,
  StatusSelect,
} from "@/components/tasks/TaskSelectComponents";
import { Card, CardContent } from "@/components/ui/card";
import useProjectRole from "@/hooks/member.hooks";
import { useUpdateTask, useUpdateTaskPriority } from "@/hooks/task.hooks";
import { cn } from "@/lib/utils";
import { useAppData } from "@/stores/app.store";
import { Tables } from "@/types/database.types";
import { Award, ChevronDown, ChevronUp } from "lucide-react";
import React, { useCallback } from "react";

// Define types
type TaskStatus = Tables<"tasks">["status"];

interface PriorityControlProps {
  value: number;
  onChange: (value: number) => void;
  maxValue: number;
  disabled: boolean;
}

// Loading Skeleton Component
const TaskSidebarSkeleton: React.FC = () => {
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

// Priority Control Component
const PriorityControl: React.FC<PriorityControlProps> = ({
  value,
  onChange,
  maxValue,
  disabled,
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

export const TaskSidebar: React.FC = () => {
  const { project, task, tasks, user, profile } = useAppData();
  const { canEdit } = useProjectRole();
  const members = project?.project_members || [];
  const { updateTask, isPending: isTaskUpdating } = useUpdateTask();
  const { mutate: updatePriority, isPending: isPriorityUpdating } =
    useUpdateTaskPriority();

  // Loading state determination
  const isLoading =
    (user && !profile) ||
    (tasks.length > 0 && project?.id !== tasks?.[0]?.project_id) ||
    !task;

  const handleStatusChange = (value: TaskStatus): void => {
    if (!task || !canEdit) return;
    updateTask(task?.id ?? "", { status: value });
  };

  const handleAssigneeChange = (value: string | null): void => {
    if (!task || !canEdit) return;
    updateTask(task.id ?? "", { assignee: value });
  };

  const handlePriorityChange = (value: number): void => {
    if (!task || !canEdit) return;
    updatePriority(value);
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
            {/* Priority Control */}
            <div>
              <label className="text-sm font-medium">Priority</label>
              <PriorityControl
                value={task?.ordinal_priority || 1}
                onChange={handlePriorityChange}
                maxValue={tasks.length}
                disabled={isTaskUpdating || isPriorityUpdating || !canEdit}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {isTaskUpdating || isPriorityUpdating
                  ? "Updating..."
                  : `${tasks.length} tasks total`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskSidebar;
