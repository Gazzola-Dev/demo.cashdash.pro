interface TasksPageProps {
  params: {
    project_id: string;
    project_slug: string;
  };
}

export default function TasksPage({
  params: { project_id, project_slug },
}: TasksPageProps) {
  return <div className="container"></div>;
}
