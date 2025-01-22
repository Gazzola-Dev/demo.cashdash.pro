"use client";

import DataTable from "@/components/tasks/TaskTable";
import { Button } from "@/components/ui/button";
import configuration from "@/configuration";
import { useGetProject } from "@/hooks/project.hooks";
import { useListTasks } from "@/hooks/task.hooks";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface TasksPageProps {
  params: {
    project_id: string;
    project_slug: string;
  };
}

export default function TasksPage({
  params: { project_id, project_slug },
}: TasksPageProps) {
  const router = useRouter();
  const { data: tasks } = useListTasks({ projectSlug: project_slug });
  const { data: project } = useGetProject(project_id);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          {project && (
            <p className="text-sm text-muted-foreground mt-1">
              {project.name} • {tasks?.length || 0} tasks
            </p>
          )}
        </div>
        <Button
          onClick={() =>
            router.push(configuration.paths.tasks.new({ project_slug }))
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      <div className="rounded-lg bg-card">
        <DataTable projectId={project_id} projectSlug={project_slug} />
      </div>
    </div>
  );
}
