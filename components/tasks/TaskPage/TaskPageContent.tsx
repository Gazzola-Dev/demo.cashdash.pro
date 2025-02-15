"use client";

import TaskPage from "@/components/tasks/TaskPage/TaskPage";
import useAppStore from "@/hooks/app.store";
import {
  useCreateComment,
  useUpdateComment,
  useUpdateTask,
} from "@/hooks/mutation.hooks";
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
  const { mutate: updateTask, isPending: updateTaskIsPending } =
    useUpdateTask();
  const { mutate: createComment } = useCreateComment(
    initialData.task.id,
    initialData.task.slug,
  );
  const { tasks } = useAppStore();
  const task = tasks.find(task => task.task.slug === taskSlug);
  const { mutate: updateComment } = useUpdateComment();

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
      taskData={task}
      onUpdate={handleUpdateTask}
      updateIsPending={updateTaskIsPending}
      onComment={handleCreateComment}
      onUpdateComment={handleUpdateComment}
    />
  );
}

export default TaskPageContent;
