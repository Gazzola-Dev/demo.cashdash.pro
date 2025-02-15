// hooks/profile.hooks.ts
"use client";

import {
  getProfileAction,
  updateProfileAction,
} from "@/actions/profile.actions";
import { useToast } from "@/hooks/use-toast";
import { conditionalLog } from "@/lib/log.utils";
import { ProfileWithDetails, UpdateProfileInput } from "@/types/profile.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

enum SuccessMessages {
  UPDATE = "Profile updated successfully",
}

export const useGetProfile = (initialData?: ProfileWithDetails | null) => {
  const hookName = "useGetProfile";

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await getProfileAction();
      conditionalLog(hookName, { data, error }, false, 10);
      return data;
    },
    initialData,
    staleTime: 1000 * 60,
  });
};

export const useUpdateProfile = () => {
  const hookName = "useUpdateProfile";
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
