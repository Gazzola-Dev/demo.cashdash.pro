// project.hooks.ts
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastQueue } from "./useToastQueue";

type Project = Tables<"projects">;

// Success messages
enum SuccessMessages {
  CREATE = "Project created successfully",
  UPDATE = "Project updated successfully",
  DELETE = "Project deleted successfully",
}

// Get project hook

export const useGetProject = (
  projectId: string,
  { initialData }: HookOptions<Project> = {},
) => {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data } = await getProjectAction(projectId);
      if (!data) throw new Error("Project not found");
      return data;
    },
    initialData: initialData || undefined,
  });
};

// List projects hook
export const useListProjects = (filters?: {
  status?: string;
  search?: string;
  sort?: string;
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

// Create project hook
export const useCreateProject = ({
  errorMessage,
  successMessage,
}: HookOptions<Project> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (project: TablesInsert<"projects">) => {
      const { data } = await createProjectAction(project);
      return data;
    },
    onSuccess: () => {
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
}: HookOptions<Project> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: TablesUpdate<"projects">;
    }) => {
      const { data } = await updateProjectAction(id, updates);
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
