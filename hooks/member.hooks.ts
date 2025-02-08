"use client";

import {
  acceptInvitationAction,
  listInvitationsAction,
  listMembersAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "@/actions/member.actions";
import { conditionalLog } from "@/lib/log.utils";
import { Tables } from "@/types/database.types";
import { HookOptions } from "@/types/db.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastQueue } from "./useToastQueue";

type ProjectMember = Tables<"project_members">;
type ProjectInvitation = Tables<"project_invitations">;

enum SuccessMessages {
  INVITE = "Invitation sent successfully",
  ACCEPT = "Invitation accepted successfully",
  UPDATE = "Member role updated successfully",
  REMOVE = "Member removed successfully",
}

// List members hook
export const useListMembers = (projectSlug: string) => {
  const hookName = "useListMembers";

  return useQuery({
    queryKey: ["project-members", projectSlug],
    queryFn: async () => {
      const { data, error } = await listMembersAction(projectSlug);
      conditionalLog(hookName, { data, error }, false);
      return data || [];
    },
  });
};

// List invitations hook
export const useListInvitations = (projectId: string) => {
  const hookName = "useListInvitations";

  return useQuery({
    queryKey: ["project-invitations", projectId],
    queryFn: async () => {
      const { data, error } = await listInvitationsAction(projectId);
      conditionalLog(hookName, { data, error }, false);
      return data || [];
    },
  });
};

// Accept invitation hook
export const useAcceptInvitation = ({
  errorMessage,
  successMessage,
}: HookOptions<ProjectInvitation> = {}) => {
  const hookName = "useAcceptInvitation";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await acceptInvitationAction(invitationId);
      conditionalLog(hookName, { data, error }, false);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
      toast({
        title: successMessage || SuccessMessages.ACCEPT,
      });
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false);
      toast({
        title: errorMessage || error.message,
        description: "Failed to accept invitation",
      });
    },
  });
};

// Update member role hook
export const useUpdateMemberRole = ({
  errorMessage,
  successMessage,
}: HookOptions<ProjectMember> = {}) => {
  const hookName = "useUpdateMemberRole";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
      role,
    }: {
      projectId: string;
      userId: string;
      role: string;
    }) => {
      const { data, error } = await updateMemberRoleAction(
        projectId,
        userId,
        role,
      );
      conditionalLog(hookName, { data, error }, false);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
      toast({
        title: successMessage || SuccessMessages.UPDATE,
      });
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false);
      toast({
        title: errorMessage || error.message,
        description: "Failed to update member role",
      });
    },
  });
};

// Remove member hook
export const useRemoveMember = ({
  errorMessage,
  successMessage,
}: HookOptions<ProjectMember> = {}) => {
  const hookName = "useRemoveMember";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
    }: {
      projectId: string;
      userId: string;
    }) => {
      const { data, error } = await removeMemberAction(projectId, userId);
      conditionalLog(hookName, { data, error }, false);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
      toast({
        title: successMessage || SuccessMessages.REMOVE,
      });
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false);
      toast({
        title: errorMessage || error.message,
        description: "Failed to remove member",
      });
    },
  });
};
