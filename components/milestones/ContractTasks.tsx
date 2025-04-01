import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useContractRole, useContractTasks } from "@/hooks/contract.hooks";
import {
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
} from "@/hooks/task.hooks";
import { useToast } from "@/hooks/use-toast";
import { DemoElementId } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { Tables } from "@/types/database.types";
import { LockIcon, PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";

type Task = Tables<"tasks">;

interface ContractTasksProps {
  tasks: Partial<Task>[];
}

function DeleteTaskDialog({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  onConfirmDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
  onConfirmDelete: (taskId: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Task</DialogTitle>
          <DialogDescription className="space-y-4">
            <p>
              Are you sure you want to permanently delete this task? This action
              cannot be undone.
            </p>
            <p>
              <strong>Task:</strong> {taskTitle}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirmDelete(taskId);
              onOpenChange(false);
            }}
          >
            Delete Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const ContractTasks: React.FC<ContractTasksProps> = ({ tasks }) => {
  const { toast } = useToast();
  const { updateTask } = useUpdateTask();
  const { createTask, isPending: isCreating } = useCreateTask();
  const { deleteTask, isPending: isDeleting } = useDeleteTask();
  const { isProjectManager, canEdit } = useContractRole();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const {
    editingTaskId,
    editingField,
    editedTitle,
    setEditedTitle,
    editedDescription,
    setEditedDescription,
    handleStartEdit,
    handleSave,
    handleKeyDown,
    handleCreateTask,
  } = useContractTasks(tasks, updateTask, createTask, isCreating);

  const handleDeleteTask = (
    taskId: string,
    taskTitle: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevent the accordion from toggling
    setTaskToDelete({ id: taskId, title: taskTitle });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  return (
    <div className="space-y-4" id={DemoElementId.CONTRACT_TASKS_EXPAND}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Contract Tasks</h3>
        <div className="flex items-center gap-2">
          {!canEdit && (
            <div className="flex items-center text-xs text-amber-600 dark:text-amber-400">
              <LockIcon className="h-4 w-4 mr-1" />
              <span>Only project managers can edit</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateTask}
            className="flex items-center gap-1"
            disabled={isCreating || !canEdit}
          >
            <PlusCircle className="h-4 w-4" />
            <span>{isCreating ? "Creating..." : "Add Task"}</span>
          </Button>
        </div>
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
                <div className="flex items-center text-sm justify-between w-full pr-2">
                  <div className="flex items-center">
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
                        className={cn(
                          "flex-1 text-left flex items-center gap-2",
                          canEdit ? "cursor-text" : "",
                        )}
                        onClick={e => {
                          if (canEdit) {
                            e.stopPropagation();
                            handleStartEdit(
                              task.id!,
                              "title",
                              task.title ?? "",
                            );
                          }
                        }}
                      >
                        <span>{task.title}</span>
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={e =>
                        handleDeleteTask(
                          task.id!,
                          task.title ?? "Untitled Task",
                          e,
                        )
                      }
                      className="h-6 w-6 opacity-70 hover:opacity-100 ml-2"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
                        className={cn(
                          "bg-gray-50/70 dark:bg-gray-900 rounded py-2 px-3 min-h-[60px] text-sm",
                          canEdit ? "cursor-text" : "",
                        )}
                        onClick={() => {
                          if (canEdit) {
                            handleStartEdit(
                              task.id!,
                              "description",
                              task.description || "",
                            );
                          }
                        }}
                      >
                        {task.description ? (
                          <p className="whitespace-pre-wrap">
                            {task.description}
                          </p>
                        ) : (
                          <p className="text-gray-500 italic">
                            {canEdit
                              ? "No description provided. Click to add one."
                              : "No description provided."}
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

      {taskToDelete && (
        <DeleteTaskDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          taskId={taskToDelete.id}
          taskTitle={taskToDelete.title}
          onConfirmDelete={confirmDeleteTask}
        />
      )}
    </div>
  );
};

export default ContractTasks;
