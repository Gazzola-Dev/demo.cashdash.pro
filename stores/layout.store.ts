import { useLayoutData } from "@/hooks/layout.hooks";
import { LayoutData } from "@/types/layout.types";
import { useEffect } from "react";
import { create } from "zustand";

interface LayoutStore {
  layoutData: LayoutData | null;
  initialized: boolean;
  setLayoutData: (data: LayoutData | null) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useLayoutStore = create<LayoutStore>(set => ({
  layoutData: null,
  initialized: false,
  setLayoutData: data => set({ layoutData: data }),
  setInitialized: initialized => set({ initialized }),
}));

// Hook to sync React Query data with Zustand
export function useLayoutSync(initialData?: LayoutData) {
  const { data } = useLayoutData(initialData);
  const { setLayoutData, setInitialized } = useLayoutStore();

  useEffect(() => {
    if (data) {
      setLayoutData(data);
      setInitialized(true);
    }
  }, [data, setLayoutData, setInitialized]);
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
