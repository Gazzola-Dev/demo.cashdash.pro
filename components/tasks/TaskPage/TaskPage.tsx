import { SubtaskSidebar } from "@/components/tasks/TaskPage/SubtaskSidebar";
import { TaskComments } from "@/components/tasks/TaskPage/TaskComments";
import { TaskDescription } from "@/components/tasks/TaskPage/TaskDescription";
import { TaskHeader } from "@/components/tasks/TaskPage/TaskHeader";
import { TaskSidebar } from "@/components/tasks/TaskPage/TaskSidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TaskResult, TaskUpdateWithSubtasks } from "@/types/task.types";
import { TerminalIcon } from "lucide-react";

interface TaskPageProps {
  taskData: TaskResult;
  onUpdate: (updates: TaskUpdateWithSubtasks) => void;
  onComment?: (content: string) => void;
  onUpdateComment?: (commentId: string, content: string) => void;
}

export function TaskPage({
  taskData,
  onUpdate,
  onComment,
  onUpdateComment,
}: TaskPageProps) {
  const isDraft = taskData.task?.status === "draft";

  const handlePublish = () => {
    onUpdate({
      status: "backlog",
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
              <Button
                variant="outline"
                size="sm"
                className="ml-4 border-amber-500 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                onClick={handlePublish}
              >
                Publish Task
              </Button>
            </div>
          </Alert>
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex-1 space-y-6">
          <TaskHeader
            task={taskData?.task}
            onSave={title => onUpdate({ title })}
          />

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
            members={[]} // TODO: Pass project members
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
