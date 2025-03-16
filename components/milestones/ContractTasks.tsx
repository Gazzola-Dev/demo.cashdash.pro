import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTask, useUpdateTask } from "@/hooks/task.hooks";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/stores/app.store";
import { Tables } from "@/types/database.types";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { KeyboardEvent, useState } from "react";

type Task = Tables<"tasks">;

interface ContractTasksProps {
  tasks: Partial<Task>[];
}

export const ContractTasks: React.FC<ContractTasksProps> = ({ tasks }) => {
  const { toast } = useToast();
  const { updateTask } = useUpdateTask();
  const { createTask, isPending: isCreating } = useCreateTask();
  const { milestone, project } = useAppData();
  const router = useRouter();

  // State for task being edited
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>("");
  const [editedDescription, setEditedDescription] = useState<string>("");

  // Handle edit start
  const handleStartEdit = (taskId: string, field: string, value: string) => {
    setEditingTaskId(taskId);
    setEditingField(field);

    if (field === "title") {
      setEditedTitle(value);
    } else if (field === "description") {
      setEditedDescription(value || "");
    }
  };

  // Handle saving changes with optimistic update
  const handleSave = (taskId: string, field: string) => {
    const updates: Partial<Task> = {};

    if (field === "title" && editedTitle.trim()) {
      updates.title = editedTitle.trim();
    } else if (field === "description") {
      updates.description = editedDescription.trim();
    }

    if (Object.keys(updates).length > 0) {
      // Call API to update - the hook handles optimistic updates
      updateTask(taskId, updates);
    }

    // Reset editing state
    setEditingTaskId(null);
    setEditingField(null);
  };

  // Handle key events
  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    taskId: string,
    field: string,
  ) => {
    if (e.key === "Enter" && field === "title") {
      e.preventDefault();
      handleSave(taskId, field);
    } else if (e.key === "Escape") {
      setEditingTaskId(null);
      setEditingField(null);
    }
  };

  // Create new task
  const handleCreateTask = () => {
    if (!project) {
      toast({
        title: "Error",
        description: "Project or milestone not found",
        variant: "destructive",
      });
      return;
    }

    // Call the createTask function from the hook
    createTask();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Contract Tasks</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreateTask}
          className="flex items-center gap-1"
          disabled={isCreating}
        >
          <PlusCircle className="h-4 w-4" />
          <span>{isCreating ? "Creating..." : "Add Task"}</span>
        </Button>
      </div>

      <Separator className="my-2" />

      {tasks.length === 0 ? (
        <div className="text-sm text-muted-foreground italic py-4 text-center">
          No tasks associated with this contract. Add a task to get started.
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {tasks.map(task => (
            <AccordionItem
              key={task.id}
              value={task.id ?? ""}
              className="border rounded-md px-4 py-1"
            >
              <AccordionTrigger className="hover:no-underline py-2">
                <div className="flex items-center text-sm">
                  <span className="font-mono mr-2">{task.ordinal_id}</span>
                  {editingTaskId === task.id && editingField === "title" ? (
                    <div className="flex-1">
                      <Input
                        value={editedTitle}
                        onChange={e => setEditedTitle(e.target.value)}
                        onBlur={() => handleSave(task.id!, "title")}
                        onKeyDown={e => handleKeyDown(e, task.id!, "title")}
                        className="h-8"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div
                      className="flex-1 text-left flex items-center gap-2"
                      onClick={e => {
                        e.stopPropagation();
                        handleStartEdit(task.id!, "title", task.title ?? "");
                      }}
                    >
                      <span>{task.title}</span>
                    </div>
                  )}
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-2 pb-3">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 dark:text-gray-400">
                      Description
                    </Label>
                    {editingTaskId === task.id &&
                    editingField === "description" ? (
                      <div className="flex flex-col gap-2">
                        <Textarea
                          value={editedDescription}
                          onChange={e => setEditedDescription(e.target.value)}
                          onBlur={() => handleSave(task.id!, "description")}
                          onKeyDown={e =>
                            handleKeyDown(e, task.id!, "description")
                          }
                          className="min-h-[100px]"
                          placeholder="Add a description for this task..."
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div
                        className="cursor-text bg-gray-50/70 dark:bg-gray-900 rounded py-2 px-3 min-h-[60px] text-sm"
                        onClick={() =>
                          handleStartEdit(
                            task.id!,
                            "description",
                            task.description || "",
                          )
                        }
                      >
                        {task.description ? (
                          <p className="whitespace-pre-wrap">
                            {task.description}
                          </p>
                        ) : (
                          <p className="text-gray-500 italic">
                            No description provided. Click to add one.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-xs pt-2 text-muted-foreground flex justify-between">
                    <span>ID: {task.ordinal_id}</span>
                    <span>
                      {task.created_at &&
                        new Date(task.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default ContractTasks;
