"use client";
import DataTable from "@/components/tasks/TaskTable";
import { Button } from "@/components/ui/button";
import configuration from "@/configuration";
import { useRouter } from "next/navigation";

export default function TasksPage({
  params: { project_id, project_slug },
}: {
  params: { project_id: string; project_slug: string };
}) {
  const router = useRouter();

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <Button
          onClick={() =>
            router.push(configuration.paths.tasks.new({ project_slug }))
          }
        >
          Create Task
        </Button>
      </div>
      <DataTable projectId={project_id} projectSlug={project_slug} />
    </div>
  );
}
