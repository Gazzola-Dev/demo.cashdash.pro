import TaskTable from "@/components/tasks/TaskTable";

interface TasksPageProps {
  params: {
    project_id: string;
    project_slug: string;
  };
}

export default function TasksPage({
  params: { project_id, project_slug },
}: TasksPageProps) {
  return (
    <div className="container">
      <TaskTable projectId={project_id} projectSlug={project_slug} />
    </div>
  );
}
