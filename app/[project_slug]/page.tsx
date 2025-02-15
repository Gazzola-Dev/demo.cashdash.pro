"use client";

import InvitePage from "@/app/[project_slug]/invite/page";
import { ProjectPage } from "@/components/projects/ProjectPage";
import ProjectPageSkeleton from "@/components/projects/ProjectPageSkeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUpdateProject } from "@/hooks/mutation.hooks";
import { useGetProject, useGetUserInvites } from "@/hooks/query.hooks";

interface ProjectPageProps {
  params: {
    project_slug: string;
  };
}

export default function ProjectOverviewPage({ params }: ProjectPageProps) {
  const { data: projectData, isPending: getProjectIsPending } = useGetProject(
    params.project_slug,
  );
  const { data: invitesData, isPending: getInvitesIsPending } =
    useGetUserInvites();
  const { mutate: updateProject } = useUpdateProject();

  const hasInvite = invitesData?.invitations.some(
    invite =>
      invite.project.slug === params.project_slug &&
      invite.status === "pending",
  );

  const handleUpdate = (updates: any) => {
    if (projectData?.id) {
      updateProject({
        projectId: projectData.id,
        updates,
      });
    }
  };

  if (getInvitesIsPending || getProjectIsPending)
    return <ProjectPageSkeleton />;

  if (!projectData && !hasInvite)
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

  if (hasInvite) return <InvitePage params={params} />;

  return <ProjectPage projectData={projectData} onUpdate={handleUpdate} />;
}
