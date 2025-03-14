"use client";

import {
  createProjectAction,
  deleteProjectAction,
} from "@/actions/project.actions";
import { useGetAppData } from "@/hooks/app.hooks";
import { useToast } from "@/hooks/use-toast";
import { conditionalLog } from "@/lib/log.utils";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export const useCreateProject = () => {
  const hookName = "useCreateProject";
  const { toast } = useToast();
  const router = useRouter();
  const { refetch } = useGetAppData();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const { data, error } = await createProjectAction();
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data;
    },
    onSuccess: data => {
      toast({
        title: "Success",
        description: "New project created successfully",
      });

      // Navigate to the new project if it was created
      if (data?.slug) {
        router.push(`/${data.slug}`);
      }

      // Refresh app data
      refetch();
    },
    onError: error => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  return {
    createProject: () => mutate(),
    isPending,
  };
};

export const useDeleteProject = () => {
  const hookName = "useDeleteProject";
  const { toast } = useToast();
  const router = useRouter();
  const { refetch } = useGetAppData();

  const { mutate, isPending } = useMutation({
    mutationFn: async (projectId: string) => {
      const { data, error } = await deleteProjectAction(projectId);
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });

      // Navigate to home after deletion
      router.push("/");

      // Refresh app data
      refetch();
    },
    onError: error => {
      toast({
        title: "Failed to delete project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProject = (projectId: string) => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "No project selected",
        variant: "destructive",
      });
      return;
    }

    mutate(projectId);
  };

  return {
    deleteProject,
    isPending,
  };
};
