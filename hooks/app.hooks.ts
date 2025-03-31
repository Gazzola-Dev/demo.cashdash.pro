import { useAppData } from "@/stores/app.store";
import { Profile, Project } from "@/types/app.types";
import { useCallback } from "react";

/**
 * Simplified hook for getting app data that just returns the current state
 */
export const useGetAppData = () => {
  return useAppData();
};

/**
 * Simplified hook for getting a task
 */
export const useGetTask = (taskIdentifier: string) => {
  const { task, setTask } = useAppData();

  // This would normally fetch data, but here we just return what's in the store
  return {
    task,
    setTask,
    isLoading: false,
    error: null,
  };
};

/**
 * Simplified hook for getting a contract
 */
export const useGetContract = (contractId: string) => {
  const { contract, setContract } = useAppData();

  // In a real implementation, this would fetch the contract by ID
  return {
    contract,
    setContract,
    isLoading: false,
    error: null,
  };
};

/**
 * Simplified hook for updating a profile
 */
export const useUpdateProfile = () => {
  const { profile, setProfile } = useAppData();

  const updateProfile = useCallback(
    (updates: Partial<Profile>) => {
      if (!profile) return;

      // Simply update the profile in the store
      setProfile({ ...profile, ...updates });
    },
    [profile, setProfile],
  );

  return {
    updateProfile,
    isPending: false,
  };
};

/**
 * Simplified hook for updating a project
 */
export const useUpdateProject = () => {
  const { project, setProject } = useAppData();

  const updateProject = useCallback(
    (projectId: string, updates: Partial<Project>) => {
      if (!project || project.id !== projectId) return;

      // Simply update the project in the store
      setProject({ ...project, ...updates });
    },
    [project, setProject],
  );

  return {
    updateProject,
    isPending: false,
  };
};
