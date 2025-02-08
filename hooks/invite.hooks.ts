"use client";

import { getUserInvitesAction } from "@/actions/invite.actions";
import { useGetUser } from "@/hooks/user.hooks";
import { UserInvites } from "@/types/invites.types";
import { useQuery } from "@tanstack/react-query";

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
