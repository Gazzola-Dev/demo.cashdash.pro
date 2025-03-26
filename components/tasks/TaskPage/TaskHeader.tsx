"use client";
import { Input } from "@/components/ui/input";
import useProjectRole from "@/hooks/member.hooks";
import { useUpdateTask } from "@/hooks/task.hooks";
import { cn } from "@/lib/utils";
import { useAppData } from "@/stores/app.store";
import { KeyboardEvent, useEffect, useState } from "react";

// Loading Skeleton Component
const TaskHeaderSkeleton = () => {
  return (
    <div className="animate-pulse flex items-start justify-between gap-4 h-10 w-full">
      <div className="flex-1">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    </div>
  );
};

export function TaskHeader() {
  const { task, user, profile, tasks, project } = useAppData();
  const { isProjectManager, canEdit } = useProjectRole();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task?.title || "");

  // Loading state determination based on the same logic as in TaskSidebar
  const isLoading =
    (user && !profile) ||
    (tasks.length && project?.id !== tasks?.[0]?.project_id) ||
    !task;

  // Update editedTitle when task changes
  useEffect(() => {
    if (task?.title) {
      setEditedTitle(task.title);
    }
  }, [task?.title]);

  const { updateTask, isPending } = useUpdateTask();

  const handleSave = () => {
    if (task && editedTitle.trim() !== task.title && canEdit) {
      updateTask(task.id, { title: editedTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSave();
    } else if (event.key === "Escape") {
      setEditedTitle(task?.title || "");
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleTitleClick = () => {
    if (canEdit) {
      setIsEditing(true);
    }
  };

  return (
    <div className="mb-6 flex items-start justify-between gap-4 w-full">
      {isLoading ? (
        <TaskHeaderSkeleton />
      ) : (
        <div className="flex-1">
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={e => setEditedTitle(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="text-2xl font-semibold"
              autoFocus
              disabled={isPending}
            />
          ) : (
            <h1
              className={cn(
                "text-2xl font-semibold",
                canEdit && "cursor-text",
                "bg-gray-50/70 dark:bg-gray-900 rounded py-1 px-2",
              )}
              onClick={handleTitleClick}
            >
              {task?.title || ""}
            </h1>
          )}
        </div>
      )}
    </div>
  );
}

export default TaskHeader;
