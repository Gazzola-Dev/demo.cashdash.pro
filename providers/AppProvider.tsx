"use client";

import { useUpdateProfile } from "@/hooks/app.hooks";
import { useAppStore } from "@/stores/app.store";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  const firstSegment = pathSegments[0];
  const secondSegment = pathSegments[1];

  const { projects, profile, tasks, task, setTask, setProfile } = useAppStore();

  const { updateProfile } = useUpdateProfile();

  // Handle project switch based on URL
  useEffect(() => {
    if (!firstSegment || !projects?.length) return;

    const matchingProject = projects.find(p => p.slug === firstSegment);

    if (matchingProject) {
      // Only update if project has changed
      if (matchingProject.id !== profile?.current_project_id) {
        console.log(`Switching to project: ${matchingProject.name}`);

        // Update current project in profile
        updateProfile({ current_project_id: matchingProject.id });

        // Update profile to trigger data loading from the cache in app.store
        setProfile({
          ...profile,
          current_project_id: matchingProject.id,
        });
      }
    }
  }, [firstSegment, projects, profile, updateProfile, setProfile]);

  // Handle task loading based on URL segments
  useEffect(() => {
    if (!firstSegment || !secondSegment || !profile || !tasks?.length) return;

    // Check if we're in the current project path
    const isCurrentProject =
      profile.current_project_id &&
      projects?.find(
        p => p.id === profile.current_project_id && p.slug === firstSegment,
      );

    if (!isCurrentProject) return;

    // Try to find task by ordinal_id first
    const ordinalId = parseInt(secondSegment, 10);
    let matchingTask = !isNaN(ordinalId)
      ? tasks.find(t => t.ordinal_id === ordinalId)
      : tasks.find(t => t.slug === secondSegment);

    if (matchingTask && matchingTask.id !== task?.id) {
      setTask({
        ...matchingTask,
        comments: [],
        subtasks: [],
        assignee_profile: matchingTask.assignee_profile || null,
      });
    }
  }, [firstSegment, secondSegment, profile, tasks, projects, setTask, task]);

  return <>{children}</>;
};

export default AppProvider;
