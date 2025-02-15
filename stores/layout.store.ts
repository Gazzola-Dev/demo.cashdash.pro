import { ProfileWithDetails } from "@/types/profile.types";
import { ProjectWithDetails } from "@/types/project.types";
import { TaskResult } from "@/types/task.types";
import { create } from "zustand";

interface LayoutState {
  profile: ProfileWithDetails | null;
  currentProject: ProjectWithDetails | null | undefined;
  projects: ProjectWithDetails[];
  tasks: TaskResult[];
  isDrawerOpen: boolean;
  isDark: boolean;
}

interface LayoutActions {
  setProfile: (profile: ProfileWithDetails | null) => void;
  setCurrentProject: (project: ProjectWithDetails | null | undefined) => void;
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
  profile: null,
  currentProject: null,
  projects: [],
  tasks: [],
  isDrawerOpen: false,
  isDark: false,
};

export type LayoutStore = LayoutState & LayoutActions;

// Create the store
const useLayoutStore = create<LayoutStore>(set => ({
  ...initialState,
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
      // Set current project from profile with required fields
      currentProject: profile.current_project
        ? {
            ...profile.current_project,
            project_members: profile.current_project.project_members || [],
            project_invitations:
              profile.current_project.project_invitations || [],
            tasks: profile.current_project.tasks || [],
            external_integrations: [],
            project_metrics: [],
          }
        : null,
      // Set transformed projects
      projects: projectsWithDetails,
      // Combine tasks from profile
      tasks: [
        // Regular tasks
        ...profile.tasks.map(task => ({
          task,
          project:
            projectsWithDetails.find(p => p.id === task.project_id) || null,
          subtasks: [],
          comments: [],
          task_schedule: null,
          assignee_profile: null,
        })),
        // Draft tasks
        ...profile.drafts.map(task => ({
          task,
          project:
            projectsWithDetails.find(p => p.id === task.project_id) || null,
          subtasks: [],
          comments: [],
          task_schedule: null,
          assignee_profile: null,
        })),
      ],
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
export const useProfile = () => useLayoutStore(state => state.profile);
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
