import { getTaskAction } from "@/actions/task.actions";
import TaskPage from "@/app/(protected)/[project_slug]/[task_slug]/TaskPage";
import { notFound } from "next/navigation";

interface TaskPageProps {
  params: {
    project_slug: string;
    task_slug: string;
  };
}

export default async function TaskPageRoute({ params }: TaskPageProps) {
  try {
    const { data: task, error } = await getTaskAction(params.task_slug);

    if (error || !task) {
      console.error("Error fetching task:", error);
      return notFound();
    }

    // Verify that the task belongs to the correct project by checking slug
    if (task.project?.slug !== params.project_slug) {
      console.error("Task does not belong to this project");
      return notFound();
    }

    return (
      <TaskPage
        projectSlug={params.project_slug}
        taskSlug={params.task_slug}
        initialData={task}
      />
    );
  } catch (error) {
    console.error("Error in TaskPageRoute:", error);
    return notFound();
  }
}
