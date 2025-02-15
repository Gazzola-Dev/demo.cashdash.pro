import { ProjectWithDetails } from "@/types/project.types";
import { TaskResult } from "@/types/task.types";
import { UserWithProfile } from "@/types/user.types";
import { create } from "zustand";

interface UIState {
  isDrawerOpen: boolean;
  toggleDrawer: (open?: boolean) => void;
}

interface LayoutState {
  user: UserWithProfile | null;
  currentProject: ProjectWithDetails | null;
  projects: ProjectWithDetails[];
  tasks: TaskResult[];
  setUser: (user: UserWithProfile | null) => void;
  setCurrentProject: (project: ProjectWithDetails | null) => void;
  setProjects: (projects: ProjectWithDetails[]) => void;
  setTasks: (tasks: TaskResult[]) => void;
  updateTask: (taskId: string, updates: Partial<TaskResult>) => void;
  addTask: (task: TaskResult) => void;
  removeTask: (taskId: string) => void;
  updateProject: (
    projectId: string,
    updates: Partial<ProjectWithDetails>,
  ) => void;
}

interface CombinedState extends UIState, LayoutState {}

export const useAppStore = create<CombinedState>(set => ({
  // UI State
  isDrawerOpen: false,
  toggleDrawer: (open?: boolean) =>
    set(state => ({ isDrawerOpen: open ?? !state.isDrawerOpen })),

  // Layout State
  user: null,
  currentProject: null,
  projects: [],
  tasks: [],

  // Layout Actions
  setUser: user => set({ user }),
  setCurrentProject: project => set({ currentProject: project }),
  setProjects: projects => set({ projects }),
  setTasks: tasks => set({ tasks }),

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
}));

// Optional: Export selectors for better performance
export const useUser = () => useAppStore(state => state.user);
export const useCurrentProject = () =>
  useAppStore(state => state.currentProject);
export const useProjects = () => useAppStore(state => state.projects);
export const useTasks = () => useAppStore(state => state.tasks);
export const useDrawer = () => ({
  isOpen: useAppStore(state => state.isDrawerOpen),
  toggle: useAppStore(state => state.toggleDrawer),
});
