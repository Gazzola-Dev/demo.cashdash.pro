"use client";

import {
  createProjectAction,
  deleteProjectAction,
  getProjectAction,
  getProjectSlugAction,
  inviteMemberAction,
  listProjectsAction,
  updateProjectAction,
} from "@/actions/project.actions";
import { useGetProfile } from "@/hooks/profile.hooks";
import { conditionalLog } from "@/lib/log.utils";
import { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { HookOptions } from "@/types/db.types";
import {
  ProjectInvitationWithProfile,
  ProjectWithDetails,
} from "@/types/project.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastQueue } from "./useToastQueue";

type Project = Tables<"projects">;

enum SuccessMessages {
  CREATE = "Project created successfully",
  UPDATE = "Project updated successfully",
  DELETE = "Project deleted successfully",
}

export const useListProjects = (filters?: {
  status?: Project["status"];
  search?: string;
  sort?: keyof Project;
  order?: "asc" | "desc";
}) => {
  const hookName = "useListProjects";

  return useQuery({
    queryKey: ["projects", filters],
    queryFn: async () => {
      const { data, error } = await listProjectsAction(filters);
      conditionalLog(hookName, { data, error }, false);
      return data || [];
    },
  });
};

export const useGetProject = (projectSlug?: string) => {
  const hookName = "useGetProject";
  const { data: profile } = useGetProfile();
  const slug = projectSlug || profile?.current_project?.slug || "";

  return useQuery({
    queryKey: ["project", projectSlug],
    queryFn: async () => {
      if (!slug) throw new Error("No project slug provided");
      const { data, error } = await getProjectAction(slug);
      conditionalLog(hookName, { data, error }, false);
      return data;
    },
    enabled: !!slug,
  });
};

export const useCreateProject = ({
  errorMessage,
  successMessage,
}: HookOptions<ProjectWithDetails> = {}) => {
  const hookName = "useCreateProject";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (project: TablesInsert<"projects">) => {
      const { data, error } = await createProjectAction(project);
      conditionalLog(hookName, { data, error }, false);
      return data;
    },
    onSuccess: data => {
      conditionalLog(hookName, { success: data }, false);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: successMessage || SuccessMessages.CREATE,
      });
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false);
      toast({
        title: errorMessage || error.message,
        description: "Failed to create project",
      });
    },
  });
};

export const useUpdateProject = ({
  errorMessage,
  successMessage,
}: HookOptions<ProjectWithDetails> = {}) => {
  const hookName = "useUpdateProject";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      projectId,
      updates,
    }: {
      projectId: string;
      updates: TablesUpdate<"projects">;
    }) => {
      const { data, error } = await updateProjectAction(projectId, updates);
      conditionalLog(hookName, { data, error }, false);
      return data;
    },
    onSuccess: data => {
      conditionalLog(hookName, { success: data }, false);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data?.id] });
      toast({
        title: successMessage || SuccessMessages.UPDATE,
      });
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false);
      toast({
        title: errorMessage || error.message,
        description: "Failed to update project",
      });
    },
  });
};

export const useDeleteProject = ({
  errorMessage,
  successMessage,
}: HookOptions<Project> = {}) => {
  const hookName = "useDeleteProject";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data, error } = await deleteProjectAction(projectId);
      conditionalLog(hookName, { data, error }, false);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: successMessage || SuccessMessages.DELETE,
      });
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false);
      toast({
        title: errorMessage || error.message,
        description: "Failed to delete project",
      });
    },
  });
};

export const useGetProjectSlug = () => {
  const hookName = "useGetProjectSlug";
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (projectName: string) => {
      const { data, error } = await getProjectSlugAction(projectName);
      conditionalLog(hookName, { data, error }, false);
      if (error) throw error;
      return data;
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false);
      toast({
        title: error.message,
        description: "Failed to generate project slug",
        variant: "destructive",
      });
    },
  });
};

export const useInviteMember = ({
  errorMessage,
  successMessage,
}: HookOptions<ProjectInvitationWithProfile> = {}) => {
  const hookName = "useInviteMember";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (invitation: TablesInsert<"project_invitations">) => {
      const { data, error } = await inviteMemberAction(invitation);
      conditionalLog(hookName, { data, error }, false, null);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: data => {
      conditionalLog(hookName, { success: data }, false);
      queryClient.invalidateQueries({ queryKey: ["project-invitations"] });
      toast({
        title: successMessage || "Invitation sent successfully",
      });
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false);
      toast({
        title: errorMessage || error.message,
        description: "Failed to send invitation",
        variant: "destructive",
      });
    },
  });
};
