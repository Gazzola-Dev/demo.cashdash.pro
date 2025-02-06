"use client";

import {
  createProjectAction,
  deleteProjectAction,
  getProjectAction,
  listProjectsAction,
  updateProjectAction,
} from "@/actions/project.actions";
import { conditionalLog } from "@/lib/log.utils";
import { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { HookOptions } from "@/types/db.types";
import { ProjectWithDetails } from "@/types/project.types";
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

export const useGetProject = (projectSlug: string) => {
  const hookName = "useGetProject";

  return useQuery({
    queryKey: ["project", projectSlug],
    queryFn: async () => {
      const { data, error } = await getProjectAction(projectSlug);
      conditionalLog(hookName, { data, error }, false);
      return data;
    },
    enabled: !!projectSlug,
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
