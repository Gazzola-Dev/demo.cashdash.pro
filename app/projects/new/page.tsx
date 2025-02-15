"use client";

import { ProjectPage } from "@/components/projects/ProjectPage";
import configuration from "@/configuration";
import { useCreateProject } from "@/hooks/mutation.hooks";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();
  const { mutate: createProject } = useCreateProject();

  const handleCreate = (projectData: any) => {
    createProject(projectData, {
      onSuccess: data => {
        if (data?.slug) {
          router.push(
            configuration.paths.project.overview({ project_slug: data.slug }),
          );
        }
      },
    });
  };

  return <ProjectPage isNew onCreate={handleCreate} />;
}
