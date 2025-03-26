// hooks/member.hooks.ts

"use client";

import {
  cancelInvitationAction,
  getProjectInvitationsAction,
  getProjectMembersAction,
  getUserPendingInvitationsAction,
  inviteProjectMembersAction,
  removeProjectMemberAction,
  toggleProjectManagerRoleAction,
} from "@/actions/member.actions";
import { useToast } from "@/hooks/use-toast";
import { conditionalLog } from "@/lib/log.utils";
import { useAppData } from "@/stores/app.store";
import { ProjectMemberWithProfile } from "@/types/app.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

export const useGetProjectMembers = (projectId?: string) => {
  const hookName = "useGetProjectMembers";

  return useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await getProjectMembersAction(projectId);
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data;
    },
    enabled: !!projectId,
    staleTime: 1000 * 60, // 1 minute
  });
};

// Updated hook to get project invitations
export const useGetProjectInvitations = (projectId?: string) => {
  const hookName = "useGetProjectInvitations";
  const { project, setProjectInvitations } = useAppData();

  return useQuery({
    queryKey: ["projectInvitations", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await getProjectInvitationsAction(projectId);
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error || String(error));

      // Update the app store with the enriched invitations
      if (data) {
        setProjectInvitations(data);
      }

      return data;
    },
    enabled: !!projectId,
    staleTime: 1000 * 60, // 1 minute
  });
};

// New hook to get user's pending invitations
export const useGetUserPendingInvitations = () => {
  const hookName = "useGetUserPendingInvitations";
  const { setUserInvitations } = useAppData();

  return useQuery({
    queryKey: ["userPendingInvitations"],
    queryFn: async () => {
      const { data, error } = await getUserPendingInvitationsAction();
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error || String(error));

      // Update the app store with the user's pending invitations
      if (data) {
        setUserInvitations(data);
      }

      return data;
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useToggleProjectManagerRole = () => {
  const hookName = "useToggleProjectManagerRole";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { project, setProject } = useAppData();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      projectId,
      userId,
      isManager,
    }: {
      projectId: string;
      userId: string;
      isManager: boolean;
    }) => {
      conditionalLog(hookName, { projectId, userId, isManager }, false);

      // Make the API call
      const { data, error } = await toggleProjectManagerRoleAction(
        projectId,
        userId,
        isManager,
      );
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data;
    },
    onMutate: async ({ projectId, userId, isManager }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["projectMembers", projectId],
      });

      // Save the previous state
      const previousMembers = queryClient.getQueryData([
        "projectMembers",
        projectId,
      ]) as ProjectMemberWithProfile[] | undefined;

      // Optimistically update project_members in the project object
      if (project) {
        const updatedMembers = project.project_members.map(member =>
          member.user_id === userId
            ? { ...member, role: isManager ? "admin" : "member" }
            : member,
        );

        setProject({
          ...project,
          project_members: updatedMembers,
        });
      }

      // Return the previous state
      return { previousMembers };
    },
    onSuccess: (_, { projectId }) => {
      toast({
        title: "Role updated",
        description: "Project member role has been updated successfully.",
      });

      // Refetch project members to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ["projectMembers", projectId],
      });

      // Also invalidate the app data to update the project members list
      queryClient.invalidateQueries({
        queryKey: ["appData"],
      });
    },
    onError: (error, { projectId }, context) => {
      // Restore previous state if needed
      if (context?.previousMembers) {
        queryClient.setQueryData(
          ["projectMembers", projectId],
          context.previousMembers,
        );
      }

      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleProjectManagerRole = useCallback(
    (projectId: string, userId: string, isManager: boolean) => {
      mutate({ projectId, userId, isManager });
    },
    [mutate],
  );

  return {
    toggleProjectManagerRole,
    isPending,
  };
};

export const useInviteProjectMembers = () => {
  const hookName = "useInviteProjectMembers";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { project } = useAppData();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ emailsInput }: { emailsInput: string }) => {
      // Parse emails from input string (comma or space separated)
      const emails = emailsInput
        .split(/[\s,]+/)
        .map(e => e.trim())
        .filter(e => e);

      conditionalLog(hookName, { emails, projectId: project?.id }, false, null);

      if (emails.length === 0) {
        throw new Error("Please enter at least one valid email address.");
      }

      if (!project?.id) throw new Error("No project selected");

      // Make the API call
      const { data, error } = await inviteProjectMembersAction(
        project?.id,
        emails,
      );
      conditionalLog(hookName, { data, error }, false, null);

      if (error) throw new Error(error);
      return data;
    },
    onSuccess: data => {
      const successMessage =
        data?.invited === 1
          ? "1 invitation sent successfully."
          : `${data?.invited} invitations sent successfully.`;
      const isErrors = (data?.errors?.length || 0) > 0;
      const errorMessage = isErrors
        ? `Failed to send ${data?.errors?.length} invitations.`
        : "";

      toast({
        title: "Invitations sent",
        description: `${successMessage} ${errorMessage}`,
        variant: isErrors ? "default" : "default",
      });

      // If there were errors, show them in a separate toast
      if (isErrors) {
        toast({
          title: "Some invitations failed",
          description: data?.errors.join("\n"),
          variant: "destructive",
        });
      }

      // Invalidate related queries to ensure fresh data
      if (project?.id) {
        queryClient.invalidateQueries({
          queryKey: ["projectInvitations", project.id],
        });
      }

      queryClient.invalidateQueries({
        queryKey: ["appData"],
      });
    },
    onError: error => {
      toast({
        title: "Failed to send invitations",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const inviteProjectMembers = useCallback(
    (emailsInput: string) => {
      if (!project?.id) {
        toast({
          title: "Error",
          description: "No project selected",
          variant: "destructive",
        });
        return;
      }

      mutate({ emailsInput });
    },
    [mutate, project?.id, toast],
  );

  return {
    inviteProjectMembers,
    isPending,
  };
};

export const useRemoveProjectMember = () => {
  const hookName = "useRemoveProjectMember";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { project, setProject } = useAppData();

  const { mutate, isPending } = useMutation({
    mutationFn: async (memberId: string) => {
      conditionalLog(hookName, { memberId }, false);

      // Make the API call
      const { data, error } = await removeProjectMemberAction(memberId);
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data;
    },
    onMutate: async memberId => {
      if (!project?.id) return {};

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["projectMembers", project.id],
      });

      // Save the previous state
      const previousMembers = queryClient.getQueryData([
        "projectMembers",
        project.id,
      ]) as ProjectMemberWithProfile[] | undefined;

      // Optimistically update project_members in the project object
      if (project) {
        const updatedMembers = project.project_members.filter(
          member => member.id !== memberId,
        );

        setProject({
          ...project,
          project_members: updatedMembers,
        });
      }

      // Return the previous state
      return { previousMembers };
    },
    onSuccess: () => {
      toast({
        title: "Member removed",
        description: "Project member has been removed successfully.",
      });

      if (project?.id) {
        // Invalidate queries to ensure fresh data
        queryClient.invalidateQueries({
          queryKey: ["projectMembers", project.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["appData"],
        });
      }
    },
    onError: (error, _, context) => {
      // Restore previous state if needed
      if (context?.previousMembers && project?.id) {
        queryClient.setQueryData(
          ["projectMembers", project.id],
          context.previousMembers,
        );
      }

      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeProjectMember = useCallback(
    (memberId: string) => {
      mutate(memberId);
    },
    [mutate],
  );

  return {
    removeProjectMember,
    isPending,
  };
};

// Updated hook to cancel invitation with better error handling
export const useCancelInvitation = () => {
  const hookName = "useCancelInvitation";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { project, setProjectInvitations, projectInvitations } = useAppData();

  const { mutate, isPending } = useMutation({
    mutationFn: async (invitationId: string) => {
      conditionalLog(hookName, { invitationId }, false);

      // Make the API call
      const { data, error } = await cancelInvitationAction(invitationId);
      conditionalLog(hookName, { data, error }, false);

      if (error) throw new Error(error);
      return data;
    },
    onMutate: async invitationId => {
      if (!project?.id) return {};

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["projectInvitations", project.id],
      });

      // Save the previous state
      const previousInvitations = [...projectInvitations];

      // Optimistically update invitations in the store
      const updatedInvitations = projectInvitations.filter(
        invite => invite.invitation.id !== invitationId,
      );
      setProjectInvitations(updatedInvitations);

      // Return the previous state
      return { previousInvitations };
    },
    onSuccess: () => {
      toast({
        title: "Invitation canceled",
        description: "The invitation has been canceled successfully.",
      });

      if (project?.id) {
        // Invalidate queries to ensure fresh data
        queryClient.invalidateQueries({
          queryKey: ["projectInvitations", project.id],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["appData"],
      });
    },
    onError: (error, _, context) => {
      // Restore previous state if needed
      if (context?.previousInvitations) {
        setProjectInvitations(context.previousInvitations);
      }

      toast({
        title: "Failed to cancel invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelInvitation = useCallback(
    (invitationId: string) => {
      mutate(invitationId);
    },
    [mutate],
  );

  return {
    cancelInvitation,
    isPending,
  };
};

export const useMembersManagement = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "member" | "invitation";
    id: string;
    name?: string;
  } | null>(null);
  const [emailsInput, setEmailsInput] = useState("");
  const { project, isAdmin, user, profile, projectInvitations } = useAppData();
  const { toggleProjectManagerRole, isPending: isTogglePending } =
    useToggleProjectManagerRole();
  const { inviteProjectMembers, isPending: isInvitePending } =
    useInviteProjectMembers();
  const { removeProjectMember, isPending: isRemovePending } =
    useRemoveProjectMember();
  const { cancelInvitation, isPending: isCancelPending } =
    useCancelInvitation();
  // Fetch project invitations
  const { isLoading: isInvitationsLoading } = useGetProjectInvitations();
  // Get project members from the project object
  const members = project?.project_members || [];
  // Loading state determination
  const isLoading = !user || !profile || !project || isInvitationsLoading;

  const handleTogglePMRole = (
    memberId: string,
    userId: string,
    isCurrentlyManager: boolean,
  ): void => {
    if (!project || !isAdmin) return;
    // Only admins can toggle PM role
    // Don't allow changing your own role
    if (userId === user?.id) return;
    toggleProjectManagerRole(project.id, userId, !isCurrentlyManager);
  };

  const handleInviteMembers = (): void => {
    inviteProjectMembers(emailsInput);
    setEmailsInput("");
    setIsInviteDialogOpen(false);
  };

  const confirmRemoveMember = (memberId: string, displayName: string): void => {
    if (!isAdmin) return;
    setConfirmAction({
      type: "member",
      id: memberId,
      name: displayName,
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmCancelInvitation = (
    invitationId: string,
    email: string,
  ): void => {
    if (!isAdmin) return;
    setConfirmAction({
      type: "invitation",
      id: invitationId,
      name: email,
    });
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmAction = (): void => {
    if (!confirmAction) return;

    if (confirmAction.type === "member") {
      removeProjectMember(confirmAction.id);
    } else if (confirmAction.type === "invitation") {
      cancelInvitation(confirmAction.id);
    }

    setIsConfirmDialogOpen(false);
    setConfirmAction(null);
  };

  const handleCancelConfirmAction = (): void => {
    setIsConfirmDialogOpen(false);
    setConfirmAction(null);
  };

  const isUserPM = (role: string): boolean => {
    return ["owner", "admin"].includes(role);
  };

  return {
    isOpen,
    setIsOpen,
    isInviteDialogOpen,
    setIsInviteDialogOpen,
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
    confirmAction,
    emailsInput,
    setEmailsInput,
    project,
    isAdmin,
    user,
    profile,
    projectInvitations,
    isTogglePending,
    isInvitePending,
    isRemovePending,
    isCancelPending,
    isLoading,
    members,
    handleTogglePMRole,
    handleInviteMembers,
    confirmRemoveMember,
    confirmCancelInvitation,
    handleConfirmAction,
    handleCancelConfirmAction,
    isUserPM,
  };
};

export const useProjectRole = () => {
  const { project, user, isAdmin } = useAppData();

  // Check if the current user is a project manager (admin, owner, or has admin role)
  const isProjectManager = (() => {
    // Admin users always have project manager privileges
    if (isAdmin) return true;

    // If no user or no project, return false
    if (!user || !project) return false;

    // Check if the user is a member of the project with the appropriate role
    const userMember = project.project_members?.find(
      member => member.user_id === user.id,
    );

    // Return true if the user has a role of "admin" or "owner"
    return userMember ? ["admin", "owner"].includes(userMember.role) : false;
  })();

  // Check if user can edit (either admin or project manager)
  const canEdit = isAdmin || isProjectManager;

  return {
    isProjectManager,
    isAdmin,
    canEdit,
  };
};

export default useProjectRole;
