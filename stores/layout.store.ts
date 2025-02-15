import { ProfileWithDetails } from "@/types/profile.types";
import { ProjectWithDetails } from "@/types/project.types";
import { TaskResult } from "@/types/task.types";
import { create } from "zustand";

interface LayoutState {
  user: ProfileWithDetails | null;
  currentProject: ProjectWithDetails | null;
  projects: ProjectWithDetails[];
  tasks: TaskResult[];
  isDrawerOpen: boolean;
  isDark: boolean;
}

interface LayoutActions {
  setUser: (user: ProfileWithDetails | null) => void;
  setCurrentProject: (project: ProjectWithDetails | null) => void;
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
const initialState: LayoutState = {
  user: null,
  currentProject: null,
  projects: [],
  tasks: [],
  isDrawerOpen: false,
  isDark: false,
};

// Create the store
const useLayoutStore = create<LayoutState & LayoutActions>(set => ({
  ...initialState,

  // Actions
  setUser: user => set({ user }),

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
export const useUser = () => useLayoutStore(state => state.user);
export const useCurrentProject = () =>
  useLayoutStore(state => state.currentProject);
export const useProjects = () => useLayoutStore(state => state.projects);
export const useTasks = () => useLayoutStore(state => state.tasks);
export const useDrawer = () => ({
  isOpen: useLayoutStore(state => state.isDrawerOpen),
  toggle: useLayoutStore(state => state.toggleDrawer),
});
export const useDarkMode = () => ({
  isDark: useLayoutStore(state => state.isDark),
  toggle: useLayoutStore(state => state.toggleDarkMode),
});

export default useLayoutStore;
