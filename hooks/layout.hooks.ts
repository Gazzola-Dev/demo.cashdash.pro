// layout.hooks.ts
"use client";

import {
  getLayoutDataAction,
  setCurrentProjectAction,
} from "@/actions/layout.actions";
import { LayoutData } from "@/types/layout.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastQueue } from "./useToastQueue";

export const useLayoutData = (initialData?: LayoutData) => {
  return useQuery<LayoutData | null>({
    queryKey: ["layout-data"],
    queryFn: async () => {
      const { data } = await getLayoutDataAction();
      return data;
    },
    initialData,
    staleTime: initialData ? 1000 * 60 : 0, // 1 minute if we have initial data
  });
};

export const useSetCurrentProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (projectSlug: string) => {
      const { data, error } = await setCurrentProjectAction(projectSlug);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["layout-data"] });
    },
    onError: (error: Error) => {
      toast({
        title: error.message,
        description: "Failed to switch project",
      });
    },
  });
};
