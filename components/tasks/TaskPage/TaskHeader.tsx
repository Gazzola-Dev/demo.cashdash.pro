import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskResult } from "@/types/task.types";
import { Edit2, Save } from "lucide-react";
import { useState } from "react";

interface TaskHeaderProps {
  task?: TaskResult["task"] | null;
  onSave: (title: string) => void;
}

export function TaskHeader({ task, onSave }: TaskHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task?.title || "");

  const handleSave = () => {
    onSave(editedTitle);
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSave();
    } else if (event.key === "Escape") {
      setEditedTitle(task?.title || "");
      setIsEditing(false);
    }
  };

  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="flex-1">
        {isEditing ? (
          <Input
            value={editedTitle}
            onChange={e => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-2xl font-semibold"
            autoFocus
          />
        ) : (
          <h1 className="text-2xl font-semibold">{task?.title || ""}</h1>
        )}
      </div>
      <div className="flex-none">
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
      </div>
    </div>
  );
}
