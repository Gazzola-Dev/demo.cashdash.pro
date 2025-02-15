"use client";
import useAppStore from "@/hooks/app.store";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";

const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { projects, currentProject, setCurrentProject } = useAppStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const firstRouteSegment = pathname.split("/")[1];

    if (
      !projects.length ||
      !firstRouteSegment ||
      !projects.some(p => p.slug === firstRouteSegment)
    ) {
      return;
    }

    const newProject = projects.find(p => p.slug === firstRouteSegment);

    if (newProject?.id !== currentProject?.id) {
      setCurrentProject(newProject);
      queryClient.invalidateQueries({
        queryKey: ["project", newProject?.slug],
      });
    }
  }, [pathname, projects, currentProject, setCurrentProject]);

  return <>{children}</>;
};

export default ProjectProvider;
