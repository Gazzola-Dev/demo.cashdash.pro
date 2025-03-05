"use client";

import {
  createMilestoneAction,
  getProjectMilestonesAction,
  setProjectCurrentMilestoneAction,
  updateMilestoneAction,
} from "@/actions/milestone.actions";
import { useToast } from "@/hooks/use-toast";
import useAppData from "@/hooks/useAppData";
import { conditionalLog } from "@/lib/log.utils";
import { MilestoneWithTasks } from "@/types/app.types";
import { Tables } from "@/types/database.types";
import {
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useState } from "react";

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

type Milestone = Tables<"milestones">;

export const useUpdateMilestone = () => {
  const hookName = "useUpdateMilestone";
  const { toast } = useToast();
  const { currentMilestone, refetch, setCurrentMilestone } = useAppData();
  const [prevState, setPrevState] = useState<MilestoneWithTasks | null>(null);
  const queryClient = useQueryClient();

  // Get the project slug for milestone refetching
  const projectSlug = useAppData().project?.slug;

  const { data: milestones, refetch: refetchMilestones } =
    useGetProjectMilestones(projectSlug);

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      milestoneId,
      updates,
    }: {
      milestoneId: string;
      updates: Partial<Milestone>;
    }) => {
      conditionalLog(hookName, { milestoneId, updates }, false);

      // Make the API call
      const { data, error } = await updateMilestoneAction(milestoneId, updates);
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data;
    },
    onMutate: async ({ milestoneId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["projectMilestones", projectSlug],
      });

      // Save the previous milestone state
      const previousMilestones = queryClient.getQueryData([
        "projectMilestones",
        projectSlug,
      ]);

      // Optimistically update the milestone in the milestones list
      if (milestones) {
        const optimisticMilestones = milestones.map(m =>
          m.id === milestoneId ? { ...m, ...updates } : m,
        );

        queryClient.setQueryData(
          ["projectMilestones", projectSlug],
          optimisticMilestones,
        );
      }

      // Optimistically update the current milestone
      if (currentMilestone && currentMilestone.id === milestoneId) {
        const updatedMilestone = {
          ...currentMilestone,
          ...updates,
        };
        setCurrentMilestone(updatedMilestone);
      }

      return { previousMilestones };
    },
    onSuccess: (data, { milestoneId }) => {
      // Apply update to the current milestone in state
      if (currentMilestone && currentMilestone.id === milestoneId) {
        const updatedMilestone = {
          ...currentMilestone,
          ...data,
        };
        setCurrentMilestone(updatedMilestone);
      }

      toast({
        title: "Milestone updated",
        description: "Milestone has been successfully updated.",
      });

      // Refresh data to ensure consistency
      refetchMilestones();
      refetch();
    },
    onError: (error, _, context) => {
      // Restore previous state if needed
      if (context?.previousMilestones) {
        queryClient.setQueryData(
          ["projectMilestones", projectSlug],
          context.previousMilestones,
        );
      }

      toast({
        title: "Failed to update milestone",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch to ensure server-client consistency
      queryClient.invalidateQueries({
        queryKey: ["projectMilestones", projectSlug],
      });
    },
  });

  const updateMilestone = useCallback(
    (milestoneId: string, updates: Partial<Milestone>) => {
      // Store current state for potential rollback
      if (currentMilestone && currentMilestone.id === milestoneId) {
        setPrevState(currentMilestone);
      }

      mutate({ milestoneId, updates });
    },
    [mutate, currentMilestone],
  );

  return {
    updateMilestone,
    isPending,
  };
};

export default useCreateMilestone;
