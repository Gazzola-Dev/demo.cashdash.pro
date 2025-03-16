import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAppData } from "@/stores/app.store";
import { Tables } from "@/types/database.types";
import { Edit2, Plus, Save } from "lucide-react";
import { useState } from "react";

type Subtask = Tables<"subtasks">;

export function SubtaskSidebar() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");

  const [isLoading, setIsLoading] = useState<string | null>(null);

  const { task } = useAppData();

  const subtasks = task?.subtasks || [];

  const handleEdit = (subtask: Subtask) => {
    setEditingId(subtask.id);
    setEditedTitle(subtask.title);
  };

  const handleSave = (subtask: Subtask) => {
    if (editedTitle.trim() !== subtask.title) {
    }
    setEditingId(null);
  };

  const handleToggleComplete = (subtask: Subtask) => {
    setIsLoading(subtask.id);
  };

  const handleAddSubtask = () => {};

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Subtasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subtasks.map((subtask, index) => (
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
                disabled={isLoading === subtask.id}
                id={subtask.id}
                checked={subtask.status === "completed"}
                onCheckedChange={() => handleToggleComplete(subtask)}
                className={cn(isLoading === subtask.id && "opacity-0")}
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
                  className={cn(
                    isLoading === subtask.id && "animate-pulse",
                    "text-sm cursor-pointer flex-1",
                    !subtask.title.trim() &&
                      index === subtasks.length - 1 &&
                      "italic text-gray-700",
                  )}
                >
                  {subtask.title.trim() || "New subtask"}
                </label>
              )}
            </div>
          </div>
        ))}

        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleAddSubtask}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add subtask
        </Button>
      </CardContent>
    </Card>
  );
}
