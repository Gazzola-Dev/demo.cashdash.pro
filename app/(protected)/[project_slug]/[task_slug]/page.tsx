import { getTaskAction } from "@/actions/task.actions";
import TaskPageContent from "@/components/tasks/TaskPage/TaskPageContent";
import { notFound } from "next/navigation";

interface TaskPageProps {
  params: {
    project_slug: string;
    task_slug: string;
  };
}

export default async function TaskPageRoute({ params }: TaskPageProps) {
  try {
    const { data: taskData, error } = await getTaskAction(params.task_slug);

    if (error || !taskData) {
      console.error("Error fetching task:", error);
      return notFound();
    }

    // Verify that the task belongs to the correct project by checking slug
    if (taskData.project?.slug !== params.project_slug) {
      console.error("Task does not belong to this project");
      return notFound();
    }

    return (
      <TaskPageContent
        projectSlug={params.project_slug}
        taskSlug={params.task_slug}
        initialData={taskData}
      />
    );
  } catch (error) {
    console.error("Error in TaskPageRoute:", error);
    return notFound();
  }
}
