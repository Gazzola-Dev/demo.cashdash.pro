"use client";

import {
  createMilestoneAction,
  deleteMilestoneAction,
  getMilestoneEventsAction,
  getProjectMilestonesAction,
  setProjectCurrentMilestoneAction,
  updateMilestoneAction,
} from "@/actions/milestone.actions";
import { useGetAppData } from "@/hooks/app.hooks";
import { useToast } from "@/hooks/use-toast";
import useSupabase from "@/hooks/useSupabase";
import { conditionalLog } from "@/lib/log.utils";
import { useAppData, useAppStore } from "@/stores/app.store";
import { MilestoneEvent, MilestoneWithTasks } from "@/types/app.types";
import { Tables } from "@/types/database.types";
import {
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

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
  const { project, setMilestone: setCurrentMilestone } = useAppData();
  const { refetch: refetchMilestones } = useGetProjectMilestones(project?.slug);

  const { refetch } = useGetAppData();
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
  const { project, setMilestone: setCurrentMilestone } = useAppData();
  const { refetch } = useGetAppData();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!project?.id) {
        throw new Error("No project selected");
      }

      const { data, error } = await createMilestoneAction(project.id);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: data => {
      toast({
        title: "Success",
        description: "New milestone created and set as current",
      });

      // Immediately update the current milestone in the app state
      if (data) {
        setCurrentMilestone(data);
      }

      // Invalidate project milestones query to trigger a refetch
      queryClient.invalidateQueries({
        queryKey: ["projectMilestones", project?.slug],
      });

      // Refresh app data to get updated project info
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
  const { milestone: currentMilestone, setMilestone: setCurrentMilestone } =
    useAppData();
  const { refetch } = useGetAppData();
  const [prevState, setPrevState] = useState<MilestoneWithTasks | null>(null);
  const queryClient = useQueryClient();

  // Get the project slug for milestone refetching
  const projectSlug = useAppData().project?.slug;

  const { data: milestones, refetch: refetchMilestones } =
    useGetProjectMilestones(projectSlug);

  // Add a reference to the events query for the current milestone
  const { refetch: refetchEvents } = useGetMilestoneEvents(
    currentMilestone?.id,
  );

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

      // Also cancel events refetches
      await queryClient.cancelQueries({
        queryKey: ["milestoneEvents", milestoneId],
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
      // After a successful update, refetch the events for this milestone
      refetchEvents();

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
    onSettled: (_, __, { milestoneId }) => {
      // Always refetch to ensure server-client consistency
      queryClient.invalidateQueries({
        queryKey: ["projectMilestones", projectSlug],
      });

      // Also invalidate events
      queryClient.invalidateQueries({
        queryKey: ["milestoneEvents", milestoneId],
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

// Add to hooks/milestone.hooks.ts
export const useDeleteMilestone = () => {
  const hookName = "useDeleteMilestone";
  const { toast } = useToast();
  const { setMilestone: setCurrentMilestone } = useAppData();
  const { refetch } = useGetAppData();
  const { refetch: refetchMilestones } = useGetProjectMilestones(
    useAppData().project?.slug,
  );
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (milestoneId: string) => {
      conditionalLog(hookName, { milestoneId }, false);

      const { data, error } = await deleteMilestoneAction(milestoneId);
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Milestone deleted",
        description: "The milestone has been successfully deleted.",
      });

      // Clear current milestone in local state
      setCurrentMilestone(null);

      // Refresh data
      refetchMilestones();
      refetch();

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["projectMilestones"],
      });
    },
    onError: error => {
      toast({
        title: "Failed to delete milestone",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMilestone = useCallback(
    (milestoneId: string) => {
      mutate(milestoneId);
    },
    [mutate],
  );

  return {
    deleteMilestone,
    isPending,
  };
};

export const useGetMilestoneEvents = (milestoneId?: string) => {
  const hookName = "useGetMilestoneEvents";

  return useQuery({
    queryKey: ["milestoneEvents", milestoneId],
    queryFn: async () => {
      if (!milestoneId) return null;

      const { data, error } = await getMilestoneEventsAction(milestoneId);
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data;
    },
    enabled: !!milestoneId,
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useMilestoneEventsRealtime = (milestoneId?: string) => {
  const hookName = "useMilestoneEventsRealtime";
  const supabase = useSupabase();
  const { milestone, setMilestone } = useAppStore();

  useEffect(() => {
    if (!supabase || !milestoneId || !milestone) return;

    conditionalLog(hookName, { subscribing: true, milestoneId }, false);

    // Subscribe to changes in the milestone_events table for this milestone
    const channel = supabase
      .channel(`milestone-events-${milestoneId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all events (insert, update, delete)
          schema: "public",
          table: "milestone_events",
          filter: `milestone_id=eq.${milestoneId}`,
        },
        payload => {
          conditionalLog(hookName, { payload }, false);

          // Handle different event types
          if (payload.eventType === "INSERT") {
            const newEvent = payload.new as any;

            // Fetch the actor information since it's not included in the payload
            supabase
              .from("profiles")
              .select("id, display_name, avatar_url, professional_title")
              .eq("id", newEvent.actor_id)
              .maybeSingle()
              .then(({ data: profile }) => {
                // Format the event to match your MilestoneEvent type
                const formattedEvent: MilestoneEvent = {
                  id: newEvent.id,
                  milestone_id: newEvent.milestone_id,
                  event_type: newEvent.event_type,
                  action: newEvent.action,
                  details: newEvent.details,
                  icon_type: newEvent.icon_type,
                  created_at: newEvent.created_at,
                  actor: {
                    id: newEvent.actor_id,
                    name: profile?.display_name || null,
                    role: newEvent.actor_role,
                    avatar: profile?.avatar_url || null,
                  },
                };

                // Update the milestone with the new event
                if (milestone) {
                  const updatedEvents = [
                    formattedEvent,
                    ...(milestone.events || []),
                  ];

                  setMilestone({
                    ...milestone,
                    events: updatedEvents,
                  });
                }
              });
          }
          // You could handle UPDATE and DELETE events similarly if needed
        },
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      conditionalLog(hookName, { unsubscribing: true, milestoneId }, false);
      supabase.removeChannel(channel);
    };
  }, [supabase, milestoneId, milestone, setMilestone]);
};

export default useMilestoneEventsRealtime;
