// stores/layout.store.ts
import { LayoutData, LayoutProject } from "@/types/layout.types";
import { useEffect } from "react";
import { create } from "zustand";

interface LayoutStore {
  layoutData: LayoutData | null;
  initialized: boolean;
  setLayoutData: (data: LayoutData | null) => void;
  setInitialized: (initialized: boolean) => void;
  setCurrentProject: (project: LayoutProject) => void;
  setSidebarOpen: (open: boolean) => void;
  sidebarOpen: boolean;
}

export const useLayoutStore = create<LayoutStore>(set => ({
  layoutData: null,
  initialized: false,
  sidebarOpen: true,
  setLayoutData: data => set({ layoutData: data }),
  setInitialized: initialized => set({ initialized }),
  setCurrentProject: project =>
    set(state => ({
      layoutData: state.layoutData
        ? {
            ...state.layoutData,
            currentProject: project,
            projects: state.layoutData.projects.map(p => ({
              ...p,
              isCurrent: p.id === project.id,
            })),
          }
        : null,
    })),
  setSidebarOpen: open => set({ sidebarOpen: open }),
}));

// Hook to sync React Query data with Zustand
export function useLayoutSync(initialData?: LayoutData) {
  const { setLayoutData, setInitialized } = useLayoutStore();

  useEffect(() => {
    if (initialData) {
      setLayoutData(initialData);
      setInitialized(true);
    }
  }, [initialData, setLayoutData, setInitialized]);
}

// Selector hooks for components
export const useCurrentProject = () =>
  useLayoutStore(state => state.layoutData?.currentProject);

export const useProjects = () =>
  useLayoutStore(state => state.layoutData?.projects ?? []);

export const useLayoutUser = () =>
  useLayoutStore(state => state.layoutData?.user);

export const usePriorityTasks = () =>
  useLayoutStore(state => state.layoutData?.priorityTasks ?? []);

export const useRecentTasks = () =>
  useLayoutStore(state => state.layoutData?.recentTasks ?? []);

export const useNavSecondary = () =>
  useLayoutStore(state => state.layoutData?.navSecondary ?? []);

export const useSidebarOpen = () => useLayoutStore(state => state.sidebarOpen);
