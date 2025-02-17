// providers/DemoDataProvider.tsx
"use client";

import useAppStore from "@/hooks/app.store";
import useDemoData from "@/hooks/useDemoData";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface DemoDataProviderProps {
  children: ReactNode;
}

const DemoDataProvider = ({ children }: DemoDataProviderProps) => {
  const pathname = usePathname();
  const { setProfile, setCurrentProject, setProjects, setTasks } =
    useAppStore();
  const demoData = useDemoData();

  useEffect(() => {
    if (demoData.project) {
      const firstMember = demoData.project.project_members[0];
      if (firstMember?.profile) {
        const projectData = {
          id: demoData.project.id,
          name: demoData.project.name,
          description: demoData.project.description,
          status: demoData.project.status,
          slug: demoData.project.slug,
          prefix: demoData.project.prefix,
          github_repo_url: demoData.project.github_repo_url,
          github_owner: demoData.project.github_owner,
          github_repo: demoData.project.github_repo,
          created_at: demoData.project.created_at,
          updated_at: demoData.project.updated_at,
        };

        setProfile({
          profile: firstMember.profile,
          projects: demoData.project.project_members.map(member => ({
            project: projectData,
            role: member.role,
            created_at: member.created_at,
          })),
          current_project: demoData.project,
          tasks: [],
          pending_invitations: [],
        });
      }
      setCurrentProject(demoData.project);
      setProjects([demoData.project]);
    }

    if (demoData.task) {
      setTasks([demoData.task]);
    }
  }, [
    pathname,
    demoData,
    setProfile,
    setCurrentProject,
    setProjects,
    setTasks,
  ]);

  return children;
};

export default DemoDataProvider;
