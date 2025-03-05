// hooks/useAppData.ts
import { useGetAppData } from "@/hooks/app.hooks";
import { useAppStore } from "@/stores/app.store";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export const useAppData = () => {
  const store = useAppStore();
  const pathname = usePathname();
  const { refetch } = useGetAppData();

  // Memoized selectors
  const currentProjectMembers = useMemo(() => {
    return store.project?.project_members || [];
  }, [store.project?.project_members]);

  const currentProjectInvitations = useMemo(() => {
    return store.project?.project_invitations || [];
  }, [store.project?.project_invitations]);

  const currentUserRole = useMemo(() => {
    if (!store.project || !store.profile) return null;
    const membership = currentProjectMembers.find(
      member => member.user_id === store.profile?.id,
    );
    return membership?.role || null;
  }, [store.project, store.profile, currentProjectMembers]);

  const assignedTasks = useMemo(() => {
    return store.tasks.filter(task => task.assignee === store.profile?.id);
  }, [store.tasks, store.profile?.id]);

  const unassignedTasks = useMemo(() => {
    return store.tasks.filter(task => !task.assignee);
  }, [store.tasks]);

  // Main data and actions
  return {
    // Core state
    user: store.user,
    profile: store.profile,
    projects: store.projects,
    project: store.project,
    tasks: store.tasks,
    task: store.task,
    invitations: store.invitations,
    subscription: store.subscription,
    appRole: store.appRole,
    isAdmin: store.appRole === "admin",
    projectMemberRole: store.projectMemberRole,
    currentMilestone: store.currentMilestone,

    // Actions
    setUser: store.setUser,
    setProfile: store.setProfile,
    setProjects: store.setProjects,
    setProject: store.setProject,
    setTasks: store.setTasks,
    setTask: store.setTask,
    reset: store.reset,
    setInvitations: store.setInvitations,
    setSubscription: store.setSubscription,
    setAppRole: store.setAppRole,
    setProjectMemberRole: store.setProjectMemberRole,
    setCurrentMilestone: store.setCurrentMilestone,
    refetch,

    // Derived data
    currentProjectMembers,
    currentProjectInvitations,
    currentUserRole,
    assignedTasks,
    unassignedTasks,
    pathname,
  };
};

export default useAppData;
