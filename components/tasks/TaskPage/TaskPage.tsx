import { SubtaskSidebar } from "@/components/tasks/TaskPage/SubtaskSidebar";
import { TaskComments } from "@/components/tasks/TaskPage/TaskComments";
import { TaskDescription } from "@/components/tasks/TaskPage/TaskDescription";
import { TaskHeader } from "@/components/tasks/TaskPage/TaskHeader";
import TaskSidebar from "@/components/tasks/TaskPage/TaskSidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import configuration from "@/configuration";
import { useDeleteTask } from "@/hooks/task.hooks";
import { useDialogQueue } from "@/hooks/useDialogQueue";
import { useToastQueue } from "@/hooks/useToastQueue";
import { useIsAdmin } from "@/hooks/user.hooks";
import { TaskResult, TaskUpdateWithSubtasks } from "@/types/task.types";
import { TerminalIcon, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface TaskPageProps {
  taskData?: TaskResult | null;
  onUpdate: (updates: TaskUpdateWithSubtasks) => void;
  onComment?: (content: string) => void;
  onUpdateComment?: (commentId: string, content: string) => void;
  isNew?: boolean;
}

export function TaskPage({
  taskData,
  onUpdate,
  onComment,
  onUpdateComment,
  isNew = false,
}: TaskPageProps) {
  const router = useRouter();
  const { toast } = useToastQueue();
  const { dialog } = useDialogQueue();
  const { mutate: deleteTask } = useDeleteTask();
  const isAdmin = useIsAdmin();

  if (!taskData) return null;
  const isDraft = taskData.task?.status === "draft" || isNew;

  const handlePublish = () => {
    onUpdate({
      status: "backlog",
    });
  };

  const handleDelete = () => {
    if (!taskData?.task?.slug) return;

    if (isNew) {
      // For new tasks, just clear the fields
      onUpdate({
        title: "",
        description: "",
        priority: "medium",
        status: "draft",
        assignee: null,
      });
      return;
    }

    dialog({
      title: "Delete Task",
      description:
        "Are you sure you want to delete this task? This action cannot be undone.",
      variant: "destructive",
      onConfirm: () => {
        deleteTask(taskData.task.slug, {
          onSuccess: () => {
            toast({
              title: "Task deleted successfully",
            });
            router.push(
              configuration.paths.tasks.all({
                project_slug: taskData.project?.slug || "",
              }),
            );
          },
          onError: error => {
            toast({
              title: "Error deleting task",
              description:
                error instanceof Error ? error.message : "An error occurred",
              variant: "destructive",
            });
          },
        });
      },
    });
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {isDraft && (
        <div className="sticky top-0 z-50 mb-4">
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
            <TerminalIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">
              Draft Mode
            </AlertTitle>
            <div className="flex items-center justify-between w-full">
              <AlertDescription className="text-amber-600 dark:text-amber-400">
                This task is currently in draft mode and is only visible to you.
              </AlertDescription>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isNew ? "Clear" : "Delete"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                  onClick={handlePublish}
                >
                  Publish Task
                </Button>
              </div>
            </div>
          </Alert>
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center">
            <TaskHeader
              task={taskData?.task}
              onSave={title => onUpdate({ title })}
            />
            {!isDraft && isAdmin && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </Button>
            )}
          </div>

          <TaskDescription
            description={taskData?.task?.description || ""}
            onSave={description => onUpdate({ description })}
          />

          {onComment && (
            <TaskComments
              comments={taskData?.comments || []}
              onSubmitComment={onComment}
              onUpdateComment={onUpdateComment}
            />
          )}
        </div>

        <div className="w-80 space-y-6">
          <TaskSidebar
            task={taskData?.task}
            taskSchedule={taskData?.task_schedule}
            assigneeProfile={taskData?.assignee_profile}
            onUpdateTask={onUpdate}
          />

          <SubtaskSidebar
            taskId={taskData?.task?.id}
            subtasks={taskData?.subtasks}
            onUpdateSubtask={(subtaskId, updates) =>
              onUpdate({
                subtasks: [{ id: subtaskId, ...updates }],
              })
            }
          />
        </div>
      </div>
    </div>
  );
}

export default TaskPage;
