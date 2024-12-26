// profile.hooks.ts
"use client";

import {
  getProfileAction,
  updatePreferencesAction,
  updateProfileAction,
  uploadAvatarAction,
} from "@/actions/profile.actions";
import { Tables, TablesUpdate } from "@/types/database.types";
import { HookOptions } from "@/types/db.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastQueue } from "./useToastQueue";

type Profile = Tables<"profiles">;

enum SuccessMessages {
  UPDATE = "Profile updated successfully",
  AVATAR = "Avatar updated successfully",
  PREFERENCES = "Preferences updated successfully",
}

// Get profile hook
export const useGetProfile = (
  userId?: string,
  { initialData }: HookOptions<Profile> = {},
) => {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data } = await getProfileAction(userId);
      if (!data) throw new Error("Profile not found");
      return data;
    },
    initialData,
  });
};

// Update profile hook
export const useUpdateProfile = ({
  errorMessage,
  successMessage,
}: HookOptions<Profile> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (updates: TablesUpdate<"profiles">) => {
      const { data } = await updateProfileAction(updates);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["profile", data?.id] });
      toast({
        title: successMessage || SuccessMessages.UPDATE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to update profile",
      });
    },
  });
};

// Upload avatar hook
export const useUploadAvatar = ({
  errorMessage,
  successMessage,
}: HookOptions<Profile> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (file: File) => {
      const { data } = await uploadAvatarAction(file);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["profile", data?.id] });
      toast({
        title: successMessage || SuccessMessages.AVATAR,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to upload avatar",
      });
    },
  });
};

// Update preferences hook
export const useUpdatePreferences = ({
  errorMessage,
  successMessage,
}: HookOptions<Profile> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      type,
      preferences,
    }: {
      type: "notification" | "ui";
      preferences: Record<string, any>;
    }) => {
      const { data } = await updatePreferencesAction(type, preferences);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["profile", data?.id] });
      toast({
        title: successMessage || SuccessMessages.PREFERENCES,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to update preferences",
      });
    },
  });
};
