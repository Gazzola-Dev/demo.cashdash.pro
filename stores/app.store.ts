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

    // Actions
    setUser: store.setUser,
    setProfile: store.setProfile,
    setProjects: store.setProjects,
    setProject: store.setProject,
    setTasks: store.setTasks,
    setTask: store.setTask,
    setInvitations: store.setInvitations,
    reset: store.reset,
  };
};
