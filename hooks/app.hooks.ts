import {
  getAppDataAction,
  getTaskAction,
  updateProfileAction,
  updateProjectAction,
} from "@/actions/app.actions";
import configuration from "@/configuration";
import { useToast } from "@/hooks/use-toast";
import { conditionalLog } from "@/lib/log.utils";
import { useAppData, useAppStore } from "@/stores/app.store";
import { AppState, ProjectWithDetails, TaskComplete } from "@/types/app.types";
import { Tables } from "@/types/database.types";
import { UseQueryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Profile = Tables<"profiles">;
type Project = Tables<"projects">;
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
    setMilestone: setMilestone,
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

        // Update current milestone with clear logging
        if (data.milestone) {
          conditionalLog(hookName, { milestone: data.milestone }, false);
          setMilestone(data.milestone);
        } else {
          setMilestone(null);
        }
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

export const useUpdateProject = () => {
  const hookName = "useUpdateProject";
  const { toast } = useToast();
  const router = useRouter();
  const { project, setProject } = useAppData();
  const [prevProject, setPrevProject] = useState<ProjectWithDetails | null>(
    null,
  );
  const { refetch: refetchAppData } = useGetAppData();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      projectId,
      updates,
    }: {
      projectId: string;
      updates: Partial<Project>;
    }) => {
      conditionalLog(hookName, { projectId, updates }, false);
      setPrevProject(project);

      // Save the old slug to check if it changed
      const oldSlug = project?.slug;

      // Optimistically update project
      if (project) {
        setProject({ ...project, ...updates });
      }

      const { data, error } = await updateProjectAction(projectId, updates);
      if (error) throw new Error(error);
      return { data, oldSlug };
    },
    onSuccess: ({ data, oldSlug }) => {
      toast({
        title: "Project updated",
        description: "Project has been successfully updated.",
      });
      setPrevProject(null);
      refetchAppData();

      // If the slug changed, redirect to the new project URL
      if (data && "slug" in data && data.slug !== oldSlug) {
        const newProjectRoute = configuration.paths.project.view({
          project_slug: data.slug,
        });
        router.push(newProjectRoute);
      }
    },
    onError: error => {
      // Restore previous project on error
      if (prevProject) {
        setProject(prevProject);
      }
      toast({
        title: "Error updating project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProject = useCallback(
    (projectId: string, updates: Partial<Project>) => {
      mutate({ projectId, updates });
    },
    [mutate],
  );

  return {
    updateProject,
    isPending,
  };
};
