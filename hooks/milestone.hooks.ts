"use client";

import {
  createMilestoneAction,
  getProjectMilestonesAction,
  setProjectCurrentMilestoneAction,
} from "@/actions/milestone.actions";
import { useToast } from "@/hooks/use-toast";
import useAppData from "@/hooks/useAppData";
import { conditionalLog } from "@/lib/log.utils";
import { MilestoneWithTasks } from "@/types/app.types";
import { UseQueryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

interface QueryConfig<TData>
  extends Omit<UseQueryOptions<TData, Error>, "queryKey" | "queryFn"> {}

export const useGetProjectMilestones = (
  projectSlug?: string,
  config?: QueryConfig<MilestoneWithTasks[] | null>,
) => {
  const hookName = "useGetProjectMilestones";

  return useQuery({
    queryKey: ["projectMilestones", projectSlug],
    queryFn: async () => {
      if (!projectSlug) return null;

      const { data, error } = await getProjectMilestonesAction(projectSlug);
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data;
    },
    enabled: !!projectSlug,
    staleTime: 1000 * 60, // 1 minute
    ...config,
  });
};

export const useSetCurrentMilestone = () => {
  const { toast } = useToast();
  const { project, refetch, setCurrentMilestone } = useAppData();
  const { refetch: refetchMilestones } = useGetProjectMilestones(project?.slug);

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      projectId,
      milestoneId,
    }: {
      projectId: string;
      milestoneId: string | null;
    }) => {
      const { data, error } = await setProjectCurrentMilestoneAction(
        projectId,
        milestoneId,
      );

      if (error) throw new Error(error);
      return data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: "Current milestone updated successfully",
      });

      // Immediately update the local state for a better user experience
      if (variables.milestoneId === null) {
        setCurrentMilestone(null);
      } else {
        // Refetch data to get updated milestone information
        refetch();
        refetchMilestones();
      }
    },
    onError: error => {
      toast({
        title: "Error",
        description: error.message || "Failed to update current milestone",
        variant: "destructive",
      });
    },
  });

  const setProjectCurrentMilestone = useCallback(
    (milestoneId: string | null) => {
      if (!project?.id) {
        toast({
          title: "Error",
          description: "No project selected",
          variant: "destructive",
        });
        return;
      }

      mutate({ projectId: project.id, milestoneId });
    },
    [mutate, project?.id, toast],
  );

  return {
    setProjectCurrentMilestone,
    isPending,
  };
};

export const useCreateMilestone = () => {
  const { toast } = useToast();
  const { project, refetch } = useAppData();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!project?.id) {
        throw new Error("No project selected");
      }

      const { data, error } = await createMilestoneAction(project.id);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New milestone created and set as current",
      });
      // Refresh app data to get updated milestone
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create milestone",
        variant: "destructive",
      });
    },
  });

  return {
    createMilestone: () => mutate(),
    isPending,
  };
};

export default useCreateMilestone;
