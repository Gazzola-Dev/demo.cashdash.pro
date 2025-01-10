"use client";

import {
  createProjectAction,
  deleteProjectAction,
  getProjectAction,
  listProjectsAction,
  updateProjectAction,
} from "@/actions/project.actions";
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

// List projects hook
export const useListProjects = (filters?: {
  status?: Project["status"];
  search?: string;
  sort?: keyof Project;
  order?: "asc" | "desc";
}) => {
  return useQuery({
    queryKey: ["projects", filters],
    queryFn: async () => {
      const { data } = await listProjectsAction(filters);
      return data || [];
    },
  });
};

// Get single project hook
export const useGetProject = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data } = await getProjectAction(projectId);
      return data;
    },
    enabled: !!projectId,
  });
};

// Create project hook
export const useCreateProject = ({
  errorMessage,
  successMessage,
}: HookOptions<ProjectWithDetails> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (project: TablesInsert<"projects">) => {
      const { data } = await createProjectAction(project);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: successMessage || SuccessMessages.CREATE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to create project",
      });
    },
  });
};

// Update project hook
export const useUpdateProject = ({
  errorMessage,
  successMessage,
}: HookOptions<ProjectWithDetails> = {}) => {
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
      const { data } = await updateProjectAction(projectId, updates);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data?.id] });
      toast({
        title: successMessage || SuccessMessages.UPDATE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to update project",
      });
    },
  });
};

// Delete project hook
export const useDeleteProject = ({
  errorMessage,
  successMessage,
}: HookOptions<Project> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data } = await deleteProjectAction(projectId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: successMessage || SuccessMessages.DELETE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to delete project",
      });
    },
  });
};
