"use client";

import {
  getLayoutDataAction,
  setCurrentProjectAction,
} from "@/actions/layout.actions";
import { conditionalLog } from "@/lib/log.utils";
import { useLayoutStore } from "@/stores/layout.store";
import { LayoutData } from "@/types/layout.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastQueue } from "./useToastQueue";

export const useLayoutData = (initialData?: LayoutData) => {
  const hookName = "useLayoutData";

  return useQuery<LayoutData | null>({
    queryKey: ["layout-data"],
    queryFn: async () => {
      const { data, error } = await getLayoutDataAction();
      conditionalLog(hookName, { data, error }, false);
      return data;
    },
    initialData,
    staleTime: initialData ? 1000 * 60 : 0, // 1 minute if we have initial data
  });
};

export const useSetCurrentProject = () => {
  const hookName = "useSetCurrentProject";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();
  const setCurrentProject = useLayoutStore(state => state.setCurrentProject);

  return useMutation({
    mutationFn: async (projectSlug: string) => {
      const { data, error } = await setCurrentProjectAction(projectSlug);
      conditionalLog(hookName, { data, error }, false);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: (_, projectSlug) => {
      // Update local store immediately
      const projects = useLayoutStore.getState().layoutData?.projects ?? [];
      const project = projects.find(p => p.slug === projectSlug);
      if (project) {
        setCurrentProject(project);
      }
      // Invalidate query to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ["layout-data"] });
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false);
      toast({
        title: "Error",
        description: error.message || "Failed to switch project",
      });
    },
  });
};
