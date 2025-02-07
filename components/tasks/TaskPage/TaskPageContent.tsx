"use client";

import TaskPage from "@/components/tasks/TaskPage/TaskPage";
import { useCreateComment, useUpdateComment } from "@/hooks/comment.hooks";
import { useGetTask, useUpdateTask } from "@/hooks/task.hooks";
import { TaskResult, TaskUpdateWithSubtasks } from "@/types/task.types";

function TaskPageContent({
  projectSlug,
  taskSlug,
  initialData,
}: {
  projectSlug: string;
  taskSlug: string;
  initialData: TaskResult;
}) {
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: createComment } = useCreateComment(
    initialData.task.id,
    initialData.task.slug,
  );
  const { mutate: updateComment } = useUpdateComment();
  const { data: taskData } = useGetTask(taskSlug, { initialData });

  const handleUpdateTask = (updates: TaskUpdateWithSubtasks) => {
    updateTask({
      slug: taskSlug,
      updates,
    });
  };

  const handleCreateComment = (content: string) => {
    createComment(content);
  };

  const handleUpdateComment = (commentId: string, content: string) => {
    updateComment({ id: commentId, content });
  };

  return (
    <TaskPage
      taskData={taskData}
      onUpdate={handleUpdateTask}
      onComment={handleCreateComment}
      onUpdateComment={handleUpdateComment}
    />
  );
}

export default TaskPageContent;
