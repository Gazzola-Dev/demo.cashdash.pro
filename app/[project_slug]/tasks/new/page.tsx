"use client";
import { TaskPage } from "@/components/tasks/TaskPage/TaskPage";
import { useUpdateTask } from "@/hooks/mutation.hooks";
import { useGetDraftTask } from "@/hooks/query.hooks";
import { TaskUpdateWithSubtasks } from "@/types/task.types";
import { useParams } from "next/navigation";

export default function NewTaskPage() {
  const params = useParams();
  const projectSlug = params.project_slug as string;

  const { data: taskData, error, isPending } = useGetDraftTask(projectSlug);
  const isDraft = true;
  const { mutate: updateTask, isPending: updateTaskIsPending } =
    useUpdateTask();

  if (isPending) return null;

  if (error || !taskData) {
    return <div>Error loading task</div>;
  }

  const handleUpdateTask = (updates: TaskUpdateWithSubtasks) => {
    updateTask({
      slug: taskData.task.slug,
      updates,
    });
  };

  return (
    <TaskPage
      updateIsPending={updateTaskIsPending}
      taskData={taskData}
      onUpdate={handleUpdateTask}
    />
  );
}
