import { useGetAppData, useGetTask, useUpdateProfile } from "@/hooks/app.hooks";
import useSupabase from "@/hooks/useSupabase";
import { useAppStore } from "@/stores/app.store";
import { Session } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { ReactNode, useCallback, useEffect } from "react";

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  const firstSegment = pathSegments[0];
  const secondSegment = pathSegments[1];

  const supabase = useSupabase();
  const {
    projects,
    profile,
    tasks,
    task,
    setTask,
    setProject,
    setUser,
    reset,
  } = useAppStore();
  const { refetch: refetchTask } = useGetTask(secondSegment);
  const { refetch: refetchAppData } = useGetAppData();
  const { updateProfile } = useUpdateProfile();

  const handleSignIn = useCallback(
    (session: Session | null) => {
      if (session?.user) {
        setUser(session.user);
        refetchAppData();
      }
    },
    [setUser, refetchAppData],
  );

  const handleSignOut = useCallback(() => {
    reset();
  }, [reset]);

  // Handle auth state changes
  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        handleSignIn(session);
      } else if (event === "SIGNED_OUT") {
        handleSignOut();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleSignIn, handleSignOut, supabase]);

  // Handle project switch and current project update
  useEffect(() => {
    if (!firstSegment || !projects?.length) return;

    const matchingProject = projects.find(p => p.slug === firstSegment);
    if (matchingProject && matchingProject.id !== profile?.current_project_id) {
      setProject({
        ...matchingProject,
        project_members: [],
        project_invitations: [],
      });
      updateProfile({ current_project_id: matchingProject.id });
      setTask(null);
    }
  }, [firstSegment, projects, setProject, profile, updateProfile, setTask]);

  // Handle task loading based on URL segments
  useEffect(() => {
    if (!firstSegment || !secondSegment || !profile || !tasks?.length) return;

    // Check if we're in the current project path
    const isCurrentProject =
      profile.current_project_id &&
      projects.find(
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
        assignee_profile: null,
      });
      refetchTask();
    }
  }, [
    firstSegment,
    secondSegment,
    profile,
    tasks,
    projects,
    setTask,
    refetchTask,
    task,
  ]);

  return <>{children}</>;
};

export default AppProvider;
