"use client";

import { ProjectPage } from "@/components/projects/ProjectPage";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();

  const handleCreate = (projectData: any) => {};

  return <ProjectPage isNew onCreate={handleCreate} />;
}
