import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tables } from "@/types/database.types";
import { TaskResult } from "@/types/task.types";
import { Edit2, Save } from "lucide-react";
import { useState } from "react";

type Subtask = Tables<"subtasks">;

interface SubtaskSidebarProps {
  subtasks: TaskResult["subtasks"];
  onUpdateSubtask: (subtaskId: string, updates: Partial<Subtask>) => void;
}

export function SubtaskSidebar({
  subtasks = [],
  onUpdateSubtask,
}: SubtaskSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");

  const handleEdit = (subtask: Subtask) => {
    setEditingId(subtask.id);
    setEditedTitle(subtask.title);
  };

  const handleSave = (subtask: Subtask) => {
    if (editedTitle.trim() !== subtask.title) {
      onUpdateSubtask(subtask.id, { title: editedTitle.trim() });
    }
    setEditingId(null);
  };

  const handleToggleComplete = (subtask: Subtask) => {
    onUpdateSubtask(subtask.id, {
      status: subtask.status === "completed" ? "todo" : "completed",
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Subtasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subtasks.map(subtask => (
          <div key={subtask.id} className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                editingId === subtask.id
                  ? handleSave(subtask)
                  : handleEdit(subtask)
              }
            >
              {editingId === subtask.id ? (
                <Save className="h-4 w-4" />
              ) : (
                <Edit2 className="h-4 w-4" />
              )}
            </Button>
            <div className="flex items-center flex-1 gap-2">
              <Checkbox
                id={subtask.id}
                checked={subtask.status === "completed"}
                onCheckedChange={() => handleToggleComplete(subtask)}
              />
              {editingId === subtask.id ? (
                <Input
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      handleSave(subtask);
                    } else if (e.key === "Escape") {
                      setEditingId(null);
                      setEditedTitle(subtask.title);
                    }
                  }}
                  className="h-8"
                  autoFocus
                />
              ) : (
                <label
                  htmlFor={subtask.id}
                  className="text-sm cursor-pointer flex-1"
                >
                  {subtask.title}
                </label>
              )}
            </div>
          </div>
        ))}
        {subtasks.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No subtasks created
          </div>
        )}
      </CardContent>
    </Card>
  );
}
