"use client";

import InvitePage from "@/app/[project_slug]/invite/page";
import { ProjectPage } from "@/components/projects/ProjectPage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import useAppStore from "@/hooks/app.store";
import { useUpdateProject } from "@/hooks/mutation.hooks";
import { useGetUserInvites } from "@/hooks/query.hooks";

interface ProjectPageProps {
  params: {
    project_slug: string;
  };
}

export default function ProjectOverviewPage({ params }: ProjectPageProps) {
  const { currentProject } = useAppStore();
  const { data: invitesData, isPending: getInvitesIsPending } =
    useGetUserInvites();
  const { mutate: updateProject } = useUpdateProject();

  const hasInvite = invitesData?.invitations.some(
    invite =>
      invite.project.slug === params.project_slug &&
      invite.status === "pending",
  );

  const handleUpdate = (updates: any) => {
    if (currentProject?.id) {
      updateProject({
        projectId: currentProject.id,
        updates,
      });
    }
  };

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

  if (!currentProject) return <InvitePage params={params} />;

  return <ProjectPage projectData={currentProject} onUpdate={handleUpdate} />;
}
