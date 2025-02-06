// hooks/profile.hooks.ts
"use client";

import {
  getProfileAction,
  updateProfileAction,
} from "@/actions/profile.actions";
import { conditionalLog } from "@/lib/log.utils";
import { ProfileResponse, UpdateProfileInput } from "@/types/profile.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastQueue } from "./useToastQueue";

enum SuccessMessages {
  UPDATE = "Profile updated successfully",
}

export const useGetProfile = (initialData?: ProfileResponse["data"]) => {
  const hookName = "useGetProfile";

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await getProfileAction();
      conditionalLog(hookName, { data, error }, false, 10);
      return data;
    },
    initialData,
    staleTime: 1000 * 60, // Data stays fresh for 1 minute
  });
};

export const useUpdateProfile = () => {
  const hookName = "useUpdateProfile";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (updates: UpdateProfileInput) => {
      const { data, error } = await updateProfileAction(updates);
      conditionalLog(hookName, { data, error }, false);
      return data;
    },
    onSuccess: data => {
      conditionalLog(hookName, { success: data }, false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: SuccessMessages.UPDATE,
      });
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false);
      toast({
        title: error.message,
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });
};
