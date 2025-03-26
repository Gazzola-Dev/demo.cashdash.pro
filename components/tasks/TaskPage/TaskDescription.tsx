"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import useProjectRole from "@/hooks/member.hooks";
import { useUpdateTask } from "@/hooks/task.hooks";
import { cn } from "@/lib/utils";
import { useAppData } from "@/stores/app.store";
import { KeyboardEvent, useEffect, useState } from "react";

// Loading Skeleton Component
const TaskDescriptionSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );
};

export function TaskDescription() {
  const { task, user, profile, tasks, project } = useAppData();
  const { isProjectManager, canEdit } = useProjectRole();
  const { updateTask, isPending } = useUpdateTask();
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(
    task?.description || "",
  );

  // Loading state determination based on the same logic as in TaskSidebar
  const isLoading =
    (user && !profile) ||
    (tasks.length && project?.id !== tasks?.[0]?.project_id) ||
    !task;

  // Update editedDescription when task changes
  useEffect(() => {
    if (task?.description != null) {
      setEditedDescription(task.description);
    }
  }, [task?.description]);

  const handleSave = () => {
    if (task && editedDescription.trim() !== task.description && canEdit) {
      updateTask(task.id, { description: editedDescription.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      handleSave();
    } else if (event.key === "Escape") {
      setEditedDescription(task?.description || "");
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleDescriptionClick = () => {
    if (canEdit) {
      setIsEditing(true);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Description</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TaskDescriptionSkeleton />
        ) : isEditing ? (
          <Textarea
            value={editedDescription}
            onChange={e => setEditedDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="min-h-[100px]"
            placeholder="Add a description..."
            autoFocus
            disabled={isPending}
          />
        ) : (
          <div
            className={cn(
              "prose dark:prose-invert whitespace-pre-line",
              canEdit && "cursor-text",
              "bg-gray-50/70 dark:bg-gray-900 rounded py-2 px-2",
            )}
            onClick={handleDescriptionClick}
          >
            {task?.description || "No description provided"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TaskDescription;
