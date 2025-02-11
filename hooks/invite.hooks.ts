"use client";

import {
  deleteInvitationAction,
  getUserInvitesAction,
  respondToInvitationAction,
} from "@/actions/invite.actions";
import { useGetUser } from "@/hooks/user.hooks";
import { UserInvites } from "@/types/invites.types";
import { ProjectInvitationWithProfile } from "@/types/project.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetUserInvites = () => {
  const { data: user } = useGetUser();
  return useQuery<UserInvites | null>({
    queryKey: ["user-invites"],
    queryFn: async () => {
      const { data, error } = await getUserInvitesAction();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 5,
  });
};

export const useRespondToInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invitationId,
      accept,
    }: {
      invitationId: string;
      accept: boolean;
    }): Promise<ProjectInvitationWithProfile> => {
      const { data, error } = await respondToInvitationAction({
        invitationId,
        accept,
      });
      if (error) throw new Error(error);
      if (!data) throw new Error("No data returned");
      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["user-invites"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

export const useDeleteInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await deleteInvitationAction(invitationId);
      if (error) throw new Error(error);
      return null;
    },
    onSuccess: () => {
      // Invalidate both project and invites queries since they contain invitation data
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["user-invites"] });
    },
  });
};
