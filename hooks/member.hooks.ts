// member.hooks.ts
"use client";

import {
  acceptInvitationAction,
  inviteMemberAction,
  listInvitationsAction,
  listMembersAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "@/actions/member.actions";
import { Tables, TablesInsert } from "@/types/database.types";
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
export const useListMembers = (projectId: string) => {
  return useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      const { data } = await listMembersAction(projectId);
      return data || [];
    },
  });
};

// List invitations hook
export const useListInvitations = (projectId: string) => {
  return useQuery({
    queryKey: ["project-invitations", projectId],
    queryFn: async () => {
      const { data } = await listInvitationsAction(projectId);
      return data || [];
    },
  });
};

// Invite member hook
export const useInviteMember = ({
  errorMessage,
  successMessage,
}: HookOptions<ProjectInvitation> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (invitation: TablesInsert<"project_invitations">) => {
      const { data } = await inviteMemberAction(invitation);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["project-invitations"] });
      toast({
        title: successMessage || SuccessMessages.INVITE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to send invitation",
      });
    },
  });
};

// Accept invitation hook
export const useAcceptInvitation = ({
  errorMessage,
  successMessage,
}: HookOptions<ProjectInvitation> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data } = await acceptInvitationAction(invitationId);
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
      const { data } = await updateMemberRoleAction(projectId, userId, role);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
      toast({
        title: successMessage || SuccessMessages.UPDATE,
      });
    },
    onError: (error: Error) => {
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
      const { data } = await removeMemberAction(projectId, userId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
      toast({
        title: successMessage || SuccessMessages.REMOVE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to remove member",
      });
    },
  });
};
