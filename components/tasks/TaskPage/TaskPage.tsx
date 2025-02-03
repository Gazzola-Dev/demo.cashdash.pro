"use client";

import { SubtaskSidebar } from "@/components/tasks/TaskPage/SubtaskSidebar";
import { TaskComments } from "@/components/tasks/TaskPage/TaskComments";
import { TaskDescription } from "@/components/tasks/TaskPage/TaskDescription";
import { TaskHeader } from "@/components/tasks/TaskPage/TaskHeader";
import { TaskSidebar } from "@/components/tasks/TaskPage/TaskSidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCreateComment, useUpdateComment } from "@/hooks/comment.hooks";
import { useGetTask, useUpdateTask } from "@/hooks/task.hooks";
import { useToastQueue } from "@/hooks/useToastQueue";
import { TerminalIcon } from "lucide-react";
import { useParams } from "next/navigation";

export default function TaskPage() {
  const params = useParams();
  const taskSlug = params.task_slug as string;
  const { toast } = useToastQueue();

  const { data: taskData } = useGetTask(taskSlug);
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: createComment } = useCreateComment(taskData?.task.id);
  const { mutate: updateComment } = useUpdateComment();

  const handleUpdateTask = (updates: any) => {
    if (!taskData) return;
    updateTask({
      slug: taskData.task.slug,
      updates,
    });
  };

  const handlePublish = () => {
    if (!taskData) return;
    updateTask({
      slug: taskData.task.slug,
      updates: { status: "backlog" },
    });
    toast({
      title: "Task published",
      description: "Task is now visible to all project members",
    });
  };

  const handleUpdateComment = (commentId: string, content: string) => {
    updateComment({ id: commentId, content });
  };

  if (!taskData) return null;

  const isDraft = taskData.task.status === "draft";

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
            task={taskData.task}
            onSave={title => handleUpdateTask({ title })}
          />

          <TaskDescription
            description={taskData.task.description || ""}
            onSave={description => handleUpdateTask({ description })}
          />

          <TaskComments
            comments={taskData.comments || []}
            onSubmitComment={content => createComment(content)}
            onUpdateComment={handleUpdateComment}
          />
        </div>

        <div className="w-80 space-y-6">
          <TaskSidebar
            task={taskData.task}
            taskSchedule={taskData.task_schedule}
            assigneeProfile={taskData.assignee_profile}
            members={[]} // TODO: Pass project members
            onUpdateTask={handleUpdateTask}
          />

          <SubtaskSidebar
            taskId={taskData.task.id}
            subtasks={taskData.subtasks}
            onUpdateSubtask={(subtaskId, updates) =>
              handleUpdateTask({
                subtasks: [{ id: subtaskId, ...updates }],
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
