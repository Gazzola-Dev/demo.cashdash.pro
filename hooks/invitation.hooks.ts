"use client";

import {
  getUserPendingInvitationsAction,
  handleInvitationResponseAction,
} from "@/actions/invitation.actions";
import { useToast } from "@/hooks/use-toast";
import { conditionalLog } from "@/lib/log.utils";
import { useAppData } from "@/stores/app.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

// Hook to get pending invitations for a user
export const useGetUserPendingInvitations = () => {
  const hookName = "useGetUserPendingInvitations";
  const { profile } = useAppData();
  const email = profile?.email;
  return useQuery({
    queryKey: ["pendingInvitations", email],
    queryFn: async () => {
      if (!email) return [];

      const { data, error } = await getUserPendingInvitationsAction(email);

      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!email,
    staleTime: 1000 * 60, // 1 minute
  });
};

// Hook to handle invitation responses (accept/decline)
export const useHandleInvitationResponse = () => {
  const hookName = "useHandleInvitationResponse";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      invitationId,
      accept,
    }: {
      invitationId: string;
      accept: boolean;
    }) => {
      conditionalLog(hookName, { invitationId, accept }, false);

      const { data, error } = await handleInvitationResponseAction(
        invitationId,
        accept,
      );

      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data;
    },
    onSuccess: (data, { accept }) => {
      const project = data?.project;
      const action = accept ? "accepted" : "declined";

      toast({
        title: `Invitation ${action}`,
        description: accept
          ? `You are now a member of ${project?.name || "the project"}.`
          : `You have declined the invitation to ${project?.name || "the project"}.`,
      });

      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations"] });

      if (accept) {
        // Also invalidate app data to refresh projects list and current project
        queryClient.invalidateQueries({ queryKey: ["appData"] });
      }
    },
    onError: error => {
      toast({
        title: "Failed to process invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInvitationResponse = useCallback(
    (invitationId: string, accept: boolean) => {
      mutate({ invitationId, accept });
    },
    [mutate],
  );

  return {
    handleInvitationResponse,
    isPending,
  };
};
