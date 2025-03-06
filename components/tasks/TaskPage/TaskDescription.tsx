// components/tasks/TaskPage/TaskDescription.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateTask } from "@/hooks/task.hooks";
import useAppData from "@/hooks/useAppData";
import { Edit2, Save } from "lucide-react";
import { useState } from "react";

export function TaskDescription() {
  const { task } = useAppData();
  const { updateTask } = useUpdateTask();

  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(
    task?.description || "",
  );

  const handleSave = () => {
    if (task && editedDescription !== task.description) {
      updateTask(task.id, { description: editedDescription });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      handleSave();
    } else if (event.key === "Escape") {
      setEditedDescription(task?.description || "");
      setIsEditing(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Description</CardTitle>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={handleSave}>
            <Save className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={editedDescription}
            onChange={e => setEditedDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px]"
            placeholder="Add a description..."
          />
        ) : (
          <div className="prose dark:prose-invert whitespace-pre-line">
            {task?.description || "No description provided"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
