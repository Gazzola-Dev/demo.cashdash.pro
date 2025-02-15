import { ProfileWithDetails } from "@/types/profile.types";
import { ProjectWithDetails } from "@/types/project.types";
import { TaskResult } from "@/types/task.types";
import { User } from "@supabase/supabase-js";
import { create } from "zustand";

interface AppState {
  profile: ProfileWithDetails | null;
  currentProject?: ProjectWithDetails | null;
  projects: ProjectWithDetails[];
  tasks: TaskResult[];
  isDrawerOpen: boolean;
  isDark: boolean;
  user?: User | null;
}

interface AppActions {
  setUser: (user?: User | null) => void;
  setProfile: (profile: ProfileWithDetails | null) => void;
  setCurrentProject: (project?: ProjectWithDetails | null) => void;
  setProjects: (projects: ProjectWithDetails[]) => void;
  setTasks: (tasks: TaskResult[]) => void;
  toggleDrawer: (open?: boolean) => void;
  toggleDarkMode: (isDark?: boolean) => void;
  updateTask: (taskId: string, updates: Partial<TaskResult>) => void;
  addTask: (task: TaskResult) => void;
  removeTask: (taskId: string) => void;
  updateProject: (
    projectId: string,
    updates: Partial<ProjectWithDetails>,
  ) => void;
  reset: () => void;
}

// Define the initial state
const initialState: AppState = {
  profile: null,
  currentProject: null,
  projects: [],
  tasks: [],
  isDrawerOpen: false,
  isDark: false,
};

export type AppStore = AppState & AppActions;

// Create the store
const useAppStore = create<AppStore>(set => ({
  ...initialState,
  setUser: user => set({ user }),
  // Actions
  setProfile: profile => {
    if (!profile) {
      set({
        profile: null,
        currentProject: null,
        projects: [],
        tasks: [],
      });
      return;
    }

    // Transform project data to match ProjectWithDetails
    const projectsWithDetails: ProjectWithDetails[] = profile.projects.map(
      p => ({
        ...p.project,
        project_members: [],
        project_invitations: [],
        tasks: [],
        external_integrations: [],
        project_metrics: [],
      }),
    );

    set({
      profile: profile,
      currentProject: profile.current_project,
      projects: projectsWithDetails,
      tasks:
        profile.current_project?.tasks?.map(task => ({
          task,
          subtasks: [],
          comments: [],
          task_schedule: null,
          assignee_profile: null,
          project: null,
        })) || [],
    });
  },
  setCurrentProject: project => set({ currentProject: project }),
  setProjects: projects => set({ projects }),
  setTasks: tasks => set({ tasks }),
  toggleDrawer: open =>
    set(state => ({ isDrawerOpen: open ?? !state.isDrawerOpen })),
  toggleDarkMode: isDark => set(state => ({ isDark: isDark ?? !state.isDark })),
  updateTask: (taskId, updates) =>
    set(state => ({
      tasks: state.tasks.map(task =>
        task.task.id === taskId ? { ...task, ...updates } : task,
      ),
    })),
  addTask: task =>
    set(state => ({
      tasks: [...state.tasks, task],
    })),
  removeTask: taskId =>
    set(state => ({
      tasks: state.tasks.filter(task => task.task.id !== taskId),
    })),
  updateProject: (projectId, updates) =>
    set(state => ({
      projects: state.projects.map(project =>
        project.id === projectId ? { ...project, ...updates } : project,
      ),
      currentProject:
        state.currentProject?.id === projectId
          ? { ...state.currentProject, ...updates }
          : state.currentProject,
    })),
  reset: () => set(initialState),
}));

// Optional: Export selectors for better performance
export const useProfile = () => useAppStore(state => state.profile);
export const useCurrentProject = () =>
  useAppStore(state => state.currentProject);
export const useProjects = () => useAppStore(state => state.projects);
export const useTasks = () => useAppStore(state => state.tasks);
export const useDrawer = () => ({
  isOpen: useAppStore(state => state.isDrawerOpen),
  toggle: useAppStore(state => state.toggleDrawer),
});
export const useDarkMode = () => ({
  isDark: useAppStore(state => state.isDark),
  toggle: useAppStore(state => state.toggleDarkMode),
});

export default useAppStore;
