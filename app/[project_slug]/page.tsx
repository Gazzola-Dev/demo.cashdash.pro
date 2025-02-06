"use client";

import { ProjectPage } from "@/components/projects/ProjectPage";
import { useGetProject, useUpdateProject } from "@/hooks/project.hooks";

interface ProjectPageProps {
  params: {
    project_slug: string;
  };
}

export default function ProjectOverviewPage({ params }: ProjectPageProps) {
  const { data: projectData } = useGetProject(params.project_slug);
  const { mutate: updateProject } = useUpdateProject();

  const handleUpdate = (updates: any) => {
    if (projectData?.id) {
      updateProject({
        projectId: projectData.id,
        updates,
      });
    }
  };

  return <ProjectPage projectData={projectData} onUpdate={handleUpdate} />;
}
