"use client";

import InvitePage from "@/app/[project_slug]/invite/page";
import { ProjectPage } from "@/components/projects/ProjectPage";
import { useGetUserInvites } from "@/hooks/invite.hooks";
import { useGetProject, useUpdateProject } from "@/hooks/project.hooks";

interface ProjectPageProps {
  params: {
    project_slug: string;
  };
}

export default function ProjectOverviewPage({ params }: ProjectPageProps) {
  const { data: projectData } = useGetProject(params.project_slug);
  const { data: invitesData } = useGetUserInvites();
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

  if (hasInvite) return <InvitePage params={params} />;

  return <ProjectPage projectData={projectData} onUpdate={handleUpdate} />;
}
