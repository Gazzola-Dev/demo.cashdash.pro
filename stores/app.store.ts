// stores/app.store.ts
import { AppState } from "@/types/app.types";
import { create } from "zustand";

const initialState = {
  user: null,
  profile: null,
  projects: [],
  project: null,
  tasks: [],
  task: null,
  invitations: [],
  subscription: null,
  appRole: null,
  projectMemberRole: null,
};

export const useAppStore = create<AppState>(set => ({
  ...initialState,

  setUser: user => set({ user }),
  setProfile: profile => set({ profile }),
  setProjects: projects => set({ projects }),
  setProject: project => set({ project }),
  setTasks: tasks => set({ tasks }),
  setTask: task => set({ task }),
  setInvitations: invitations => set({ invitations }),
  setSubscription: subscription => set({ subscription }),
  setAppRole: appRole => set({ appRole }),
  setProjectMemberRole: projectMemberRole => set({ projectMemberRole }),
  reset: () => set(initialState),
}));

// Hook for accessing store data
export const useAppData = () => {
  const store = useAppStore();

  return {
    // Core data
    user: store.user,
    profile: store.profile,
    projects: store.projects,
    project: store.project,
    tasks: store.tasks,
    task: store.task,
    invitations: store.invitations,
    subscription: store.subscription,
    appRole: store.appRole,
    projectMemberRole: store.projectMemberRole,

    // Actions
    setUser: store.setUser,
    setProfile: store.setProfile,
    setProjects: store.setProjects,
    setProject: store.setProject,
    setTasks: store.setTasks,
    setTask: store.setTask,
    setInvitations: store.setInvitations,
    setSubscription: store.setSubscription,
    setAppRole: store.setAppRole,
    setProjectMemberRole: store.setProjectMemberRole,
    reset: store.reset,
  };
};
