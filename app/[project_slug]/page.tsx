"use client";

import { ProjectPage } from "@/components/projects/ProjectPage";
import useDemoData from "@/hooks/useDemoData";

interface ProjectPageProps {
  params: {
    project_slug: string;
  };
}

export default function ProjectOverviewPage({ params }: ProjectPageProps) {
  const { project } = useDemoData();

  const handleUpdate = () => {};

  return <ProjectPage projectData={project} onUpdate={handleUpdate} />;
}
