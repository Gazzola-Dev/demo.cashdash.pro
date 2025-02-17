"use client";

import { ProjectPage } from "@/components/projects/ProjectPage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import useAppStore from "@/hooks/app.store";

interface ProjectPageProps {
  params: {
    project_slug: string;
  };
}

export default function ProjectOverviewPage({ params }: ProjectPageProps) {
  const { currentProject } = useAppStore();
  const getInvitesIsPending = false;

  const hasInvite = false;

  const handleUpdate = () => {};

  if (!currentProject && !hasInvite && !getInvitesIsPending)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            The project you are looking for does not exist or you do not have
            access to it.
          </CardDescription>
        </CardContent>
      </Card>
    );

  return <ProjectPage projectData={currentProject} onUpdate={handleUpdate} />;
}
