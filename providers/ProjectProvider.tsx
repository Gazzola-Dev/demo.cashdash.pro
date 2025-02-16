"use client";
import useAppStore from "@/hooks/app.store";
import { useGetProfile } from "@/hooks/query.hooks";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";

const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { projects, currentProject, setCurrentProject } = useAppStore();
  const { refetch: refetchProfile } = useGetProfile();

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
      refetchProfile();
      setCurrentProject(newProject);
    }
  }, [pathname, projects, currentProject, setCurrentProject, refetchProfile]);

  return <>{children}</>;
};

export default ProjectProvider;
