"use client";

import { getUserInvitesAction } from "@/actions/invite.actions";
import { UserInvites } from "@/types/invites.types";
import { useQuery } from "@tanstack/react-query";

export const useGetUserInvites = () => {
  return useQuery<UserInvites | null>({
    queryKey: ["user-invites"],
    queryFn: async () => {
      const { data, error } = await getUserInvitesAction();
      if (error) throw error;
      return data;
    },
  });
};
