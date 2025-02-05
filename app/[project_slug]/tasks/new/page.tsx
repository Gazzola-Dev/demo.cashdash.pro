"use client";
import { TaskPage } from "@/components/tasks/TaskPage/TaskPage";
import { useGetDraftTask, useUpdateTask } from "@/hooks/task.hooks";
import { TaskUpdateWithSubtasks } from "@/types/task.types";
import { useParams } from "next/navigation";

export default function NewTaskPage() {
  const params = useParams();
  const projectSlug = params.project_slug as string;

  const { data: taskData, error } = useGetDraftTask(projectSlug);
  const isDraft = true;
  const { mutate: updateTask } = useUpdateTask({}, isDraft);

  if (error || !taskData) {
    return <div>Error loading task</div>;
  }

  const handleUpdateTask = (updates: TaskUpdateWithSubtasks) => {
    updateTask({
      slug: taskData.task.slug,
      updates,
    });
  };

  return <TaskPage taskData={taskData} onUpdate={handleUpdateTask} />;
}
