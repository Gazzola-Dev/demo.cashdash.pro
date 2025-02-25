import {
  getAppDataAction,
  getTaskAction,
  updateProfileAction,
} from "@/actions/app.actions";
import { useToast } from "@/hooks/use-toast";
import useAppData from "@/hooks/useAppData";
import { conditionalLog } from "@/lib/log.utils";
import { useAppStore } from "@/stores/app.store";
import { AppState, TaskComplete } from "@/types/app.types";
import { Tables } from "@/types/database.types";
import { UseQueryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

type Profile = Tables<"profiles">;
interface QueryConfig<TData>
  extends Omit<UseQueryOptions<TData, Error>, "queryKey" | "queryFn"> {}

type AppStateWithoutTask = Omit<AppState, "task">;

export const useGetAppData = (
  initialData?: AppStateWithoutTask | null,
  config?: QueryConfig<AppStateWithoutTask | null>,
) => {
  const hookName = "useGetAppData";
  const {
    setUser,
    setProfile,
    setProjects,
    setProject,
    setTasks,
    setInvitations,
    setSubscription,
    setAppRole,
    setProjectMemberRole,
  } = useAppStore();

  return useQuery({
    queryKey: ["appData"],
    queryFn: async () => {
      const { data, error } = await getAppDataAction();
      conditionalLog(hookName, { data, error }, false);
      if (error) throw new Error(error);

      // Update store with fetched data
      if (data) {
        setProfile(data.profile);
        setProjects(data.projects);
        setProject(data.project);
        setTasks(data.tasks);
        setInvitations(data.invitations);

        // Update new data
        setSubscription(data.subscription);
        setAppRole(data.appRole);
        setProjectMemberRole(data.projectMemberRole);
      }

      return data;
    },
    initialData,
    staleTime: 1000 * 60, // 1 minute
    ...config,
  });
};

export const useGetTask = (
  taskIdentifier: string,
  initialData?: TaskComplete | null,
  config?: QueryConfig<TaskComplete | null>,
) => {
  const hookName = "useGetTask";
  const { setTask } = useAppStore();

  return useQuery({
    queryKey: ["task", taskIdentifier],
    queryFn: async () => {
      const { data, error } = await getTaskAction(taskIdentifier);
      conditionalLog(hookName, { data, error }, false);
      if (error) throw new Error(error);

      // Update store with fetched task data
      if (data) {
        setTask(data);
      }

      return data;
    },
    initialData,
    staleTime: 1000 * 60, // 1 minute
    enabled: !!taskIdentifier,
    ...config,
  });
};

export const useUpdateProfile = () => {
  const { toast } = useToast();
  const { profile, setProfile } = useAppData();
  const [prevProfile, setPrevProfile] = useState<Profile | null>(null);
  const { refetch: refetchAppData } = useGetAppData();

  const { mutate, isPending } = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!profile?.id) throw new Error("No profile ID");
      setPrevProfile(profile);

      // Optimistically update profile
      setProfile({ ...profile, ...updates });

      const { data, error } = await updateProfileAction(profile.id, updates);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setPrevProfile(null);
      refetchAppData();
    },
    onError: error => {
      // Restore previous profile on error
      if (prevProfile) {
        setProfile(prevProfile);
      }
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProfile = useCallback(
    (updates: Partial<Profile>) => {
      mutate(updates);
    },
    [mutate],
  );

  return {
    updateProfile,
    isPending,
  };
};
