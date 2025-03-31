"use client";

import { useToast } from "@/hooks/use-toast";
import { conditionalLog } from "@/lib/log.utils";
import { useAppData } from "@/stores/app.store";
import {
  ProjectInvitationWithDetails,
  ProjectInvitationWithProfile,
} from "@/types/app.types";
import { useCallback, useState } from "react";

/**
 * Hook for getting project members
 */
export const useGetProjectMembers = (projectId?: string) => {
  const hookName = "useGetProjectMembers";
  const { project } = useAppData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get members directly from the project in store
  const data =
    projectId && project?.id === projectId ? project.project_members || [] : [];

  conditionalLog(hookName, { data, error }, false);

  return {
    data,
    isLoading,
    error,
  };
};

/**
 * Hook for getting project invitations
 */
export const useGetProjectInvitations = (projectId?: string) => {
  const hookName = "useGetProjectInvitations";
  const { project, projectInvitations, setProjectInvitations } = useAppData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get invitations directly from the project in store
  const data =
    projectId && project?.id === projectId
      ? projectInvitations.filter(
          inv => inv.invitation?.project_id === projectId,
        )
      : [];

  conditionalLog(hookName, { data, error }, false);

  // Update the app store with the enriched invitations
  if (data && data.length > 0) {
    setProjectInvitations(data);
  }

  return {
    data,
    isLoading,
    error,
  };
};

/**
 * Hook for getting user's pending invitations
 */
export const useGetUserPendingInvitations = () => {
  const hookName = "useGetUserPendingInvitations";
  const { userInvitations, setUserInvitations } = useAppData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  conditionalLog(hookName, { data: userInvitations, error }, false);

  return {
    data: userInvitations || [],
    isLoading,
    error,
  };
};

/**
 * Hook to update a project member
 */
export const useUpdateProjectMember = () => {
  const hookName = "useUpdateProjectMember";
  const { toast } = useToast();
  const { project, setProject } = useAppData();
  const [isPending, setIsPending] = useState(false);

  const updateProjectMember = useCallback(
    (memberId: string, role: string) => {
      conditionalLog(hookName, { memberId, role }, false);

      if (!project) return { success: false };

      setIsPending(true);

      try {
        // Update the member in the project members array
        const updatedMembers = project.project_members?.map(member =>
          member.id === memberId
            ? { ...member, role, updated_at: new Date().toISOString() }
            : member,
        );

        // Update the project in the store
        setProject({
          ...project,
          project_members: updatedMembers,
        });

        toast({
          title: "Role updated",
          description: `Project member role has been updated to ${role}.`,
        });

        return { success: true };
      } catch (error) {
        console.error("Error updating project member:", error);

        toast({
          title: "Update failed",
          description: "Failed to update project member role.",
          variant: "destructive",
        });

        return { success: false };
      } finally {
        setIsPending(false);
      }
    },
    [project, setProject, toast],
  );

  return {
    updateProjectMember,
    isPending,
  };
};

/**
 * Hook to toggle a project manager role
 */
export const useToggleProjectManagerRole = () => {
  const hookName = "useToggleProjectManagerRole";
  const { toast } = useToast();
  const { project, setProject } = useAppData();
  const [isPending, setIsPending] = useState(false);

  // Use the new hook internally
  const { updateProjectMember, isPending: isUpdatePending } =
    useUpdateProjectMember();

  const toggleProjectManagerRole = useCallback(
    (projectId: string, userId: string, isManager: boolean) => {
      conditionalLog(hookName, { projectId, userId, isManager }, false);

      if (!project || project.id !== projectId) return { success: false };

      setIsPending(true);

      try {
        // Find the member by userId
        const member = project.project_members?.find(m => m.user_id === userId);

        if (member?.id) {
          // Use the updateProjectMember function with the memberId
          return updateProjectMember(member.id, isManager ? "pm" : "member");
        }

        // Fall back to direct update if member not found
        const updatedMembers = project.project_members?.map(member =>
          member.user_id === userId
            ? { ...member, role: isManager ? "admin" : "member" }
            : member,
        );

        setProject({
          ...project,
          project_members: updatedMembers,
        });

        toast({
          title: "Role updated",
          description: "Project member role has been updated successfully.",
        });

        return { success: true };
      } catch (error) {
        console.error("Error toggling project manager role:", error);

        toast({
          title: "Failed to update role",
          description: String(error),
          variant: "destructive",
        });

        return { success: false };
      } finally {
        setIsPending(false);
      }
    },
    [project, setProject, toast, updateProjectMember],
  );

  // Combine isPending states from both approaches
  const combinedIsPending = isPending || isUpdatePending;

  return {
    toggleProjectManagerRole,
    isPending: combinedIsPending,
  };
};

/**
 * Hook to invite project members
 */
export const useInviteProjectMembers = () => {
  const hookName = "useInviteProjectMembers";
  const { toast } = useToast();
  const {
    project,
    user,
    setProject,
    setProjectInvitations,
    projectInvitations,
  } = useAppData();
  const [isPending, setIsPending] = useState(false);

  const inviteProjectMembers = useCallback(
    (emailsInput: string) => {
      conditionalLog(
        hookName,
        { emailsInput, projectId: project?.id },
        false,
        null,
      );

      if (!project?.id || !user?.id) {
        toast({
          title: "Error",
          description: "No project selected or user not authenticated",
          variant: "destructive",
        });
        return { success: false };
      }

      setIsPending(true);

      try {
        // Parse emails (supporting comma, semicolon, or whitespace separation)
        const emails = emailsInput
          .split(/[\s,;]+/)
          .map(email => email.trim())
          .filter(email => email.length > 0);

        if (emails.length === 0) {
          toast({
            title: "No valid emails",
            description: "Please enter at least one valid email address.",
            variant: "destructive",
          });
          return { success: false };
        }

        // Create invitation objects for each email
        const newInvitations: Partial<ProjectInvitationWithDetails>[] =
          emails.map(email => ({
            invitation: {
              id: `invitation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              project_id: project.id!,
              email: email,
              invited_by: user.id!,
              role: "member",
              status: "pending",
              created_at: new Date().toISOString(),
              expires_at: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000,
              ).toISOString(), // 7 days from now
            },
            project: {
              id: project.id!,
              name: project.name!,
            },
            sender_profile: {
              id: user.id!,
              display_name: user.user_metadata?.full_name || "Unknown User",
              avatar_url: null,
              professional_title: null,
            },
          }));

        // Add new invitations to project and global invitations state
        setProjectInvitations([...projectInvitations, ...newInvitations]);

        // Also update project invitations
        if (project.project_invitations) {
          // Create proper ProjectInvitationWithProfile objects
          const invitationsWithProfiles: Partial<ProjectInvitationWithProfile>[] =
            newInvitations.map(inv => ({
              ...inv.invitation,
              profile: null, // Add the required profile field (null is acceptable)
            }));

          setProject({
            ...project,
            project_invitations: [
              ...project.project_invitations,
              ...invitationsWithProfiles,
            ],
          });
        }

        const successMessage =
          emails.length === 1
            ? "1 invitation sent successfully."
            : `${emails.length} invitations sent successfully.`;

        toast({
          title: "Invitations sent",
          description: successMessage,
        });

        conditionalLog(
          hookName,
          { success: true, invited: emails.length },
          false,
          null,
        );
        return { success: true, invited: emails.length, errors: [] };
      } catch (error) {
        console.error("Error inviting project members:", error);

        toast({
          title: "Invitation failed",
          description: "Failed to send invitations. Please try again.",
          variant: "destructive",
        });

        return { success: false };
      } finally {
        setIsPending(false);
      }
    },
    [
      project,
      user,
      setProject,
      setProjectInvitations,
      projectInvitations,
      toast,
    ],
  );

  return {
    inviteProjectMembers,
    isPending,
  };
};

/**
 * Hook to remove a project member
 */
export const useRemoveProjectMember = () => {
  const hookName = "useRemoveProjectMember";
  const { toast } = useToast();
  const { project, setProject } = useAppData();
  const [isPending, setIsPending] = useState(false);

  const removeProjectMember = useCallback(
    (memberId: string) => {
      conditionalLog(hookName, { memberId }, false);

      if (!project) return { success: false };

      setIsPending(true);

      try {
        // Filter out the member to remove
        const updatedMembers = project.project_members?.filter(
          member => member.id !== memberId,
        );

        // Update the project in the store
        setProject({
          ...project,
          project_members: updatedMembers,
        });

        toast({
          title: "Member removed",
          description: "Project member has been removed successfully.",
        });

        return { success: true };
      } catch (error) {
        console.error("Error removing project member:", error);

        toast({
          title: "Removal failed",
          description: "Failed to remove project member.",
          variant: "destructive",
        });

        return { success: false };
      } finally {
        setIsPending(false);
      }
    },
    [project, setProject, toast],
  );

  return {
    removeProjectMember,
    isPending,
  };
};

/**
 * Hook to cancel an invitation
 */
export const useCancelInvitation = () => {
  const hookName = "useCancelInvitation";
  const { toast } = useToast();
  const { project, setProject, projectInvitations, setProjectInvitations } =
    useAppData();
  const [isPending, setIsPending] = useState(false);

  const cancelInvitation = useCallback(
    (invitationId: string) => {
      conditionalLog(hookName, { invitationId }, false);

      setIsPending(true);

      try {
        // Remove invitation from global invitations state
        const updatedInvitations = projectInvitations.filter(
          invite => invite?.invitation?.id !== invitationId,
        );
        setProjectInvitations(updatedInvitations);

        // Also update project invitations if it's the current project
        if (project && project.project_invitations) {
          const updatedProjectInvitations = project.project_invitations.filter(
            invitation => invitation.id !== invitationId,
          );

          setProject({
            ...project,
            project_invitations: updatedProjectInvitations,
          });
        }

        toast({
          title: "Invitation canceled",
          description: "The invitation has been canceled successfully.",
        });

        return { success: true };
      } catch (error) {
        console.error("Error canceling invitation:", error);

        toast({
          title: "Cancellation failed",
          description: "Failed to cancel invitation.",
          variant: "destructive",
        });

        return { success: false };
      } finally {
        setIsPending(false);
      }
    },
    [project, setProject, projectInvitations, setProjectInvitations, toast],
  );

  return {
    cancelInvitation,
    isPending,
  };
};

/**
 * Hook for members management
 * This is the main hook that needs to be updated
 */
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
  const { updateProjectMember, isPending: isUpdatePending } =
    useUpdateProjectMember();
  const { toggleProjectManagerRole, isPending: isTogglePending } =
    useToggleProjectManagerRole();
  const { inviteProjectMembers, isPending: isInvitePending } =
    useInviteProjectMembers();
  const { removeProjectMember, isPending: isRemovePending } =
    useRemoveProjectMember();
  const { cancelInvitation, isPending: isCancelPending } =
    useCancelInvitation();

  // Get project members from the project object
  const members = project?.project_members || [];

  // Loading state determination
  const isLoading = !user || !profile || !project;

  // Fetch project invitations
  const { isLoading: isInvitationsLoading } = useGetProjectInvitations(
    project?.id,
  );

  const handleTogglePMRole = useCallback(
    (memberId: string, userId: string, isCurrentlyManager: boolean) => {
      if (!project || !isAdmin) return;

      // Only admins can toggle PM role
      // Don't allow changing your own role
      if (userId === user?.id) return;

      // Use the new updateProjectMember directly
      updateProjectMember(memberId, isCurrentlyManager ? "member" : "pm");
    },
    [project, isAdmin, user?.id, updateProjectMember],
  );

  const handleInviteMembers = useCallback(() => {
    inviteProjectMembers(emailsInput);
    setEmailsInput("");
    setIsInviteDialogOpen(false);
  }, [emailsInput, inviteProjectMembers]);

  const confirmRemoveMember = useCallback(
    (memberId: string, displayName: string) => {
      if (!isAdmin) return;
      setConfirmAction({
        type: "member",
        id: memberId,
        name: displayName,
      });
      setIsConfirmDialogOpen(true);
    },
    [isAdmin],
  );

  const confirmCancelInvitation = useCallback(
    (invitationId: string, email: string) => {
      if (!isAdmin) return;
      setConfirmAction({
        type: "invitation",
        id: invitationId,
        name: email,
      });
      setIsConfirmDialogOpen(true);
    },
    [isAdmin],
  );

  const handleConfirmAction = useCallback(() => {
    if (!confirmAction) return;

    if (confirmAction.type === "member") {
      removeProjectMember(confirmAction.id);
    } else if (confirmAction.type === "invitation") {
      cancelInvitation(confirmAction.id);
    }

    setIsConfirmDialogOpen(false);
    setConfirmAction(null);
  }, [confirmAction, removeProjectMember, cancelInvitation]);

  const handleCancelConfirmAction = useCallback(() => {
    setIsConfirmDialogOpen(false);
    setConfirmAction(null);
  }, []);

  /**
   * Updated isUserPM function to handle different role formats
   * This is the key change needed to fix the issue
   */
  const isUserPM = useCallback((role: string): boolean => {
    if (!role) return false;

    // Normalize the role string to lowercase for case-insensitive comparison
    const normalizedRole = role.toLowerCase();

    // Check against all possible PM role variations
    return ["owner", "admin", "pm", "project_manager", "project manager"].some(
      pmRole => normalizedRole.includes(pmRole),
    );
  }, []);

  return {
    isOpen,
    setIsOpen,
    isInviteDialogOpen,
    setIsInviteDialogOpen,
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
    confirmAction,
    setConfirmAction,
    emailsInput,
    setEmailsInput,
    project,
    isAdmin,
    user,
    profile,
    projectInvitations,
    isTogglePending,
    isUpdatePending,
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
    isInvitationsLoading,
  };
};

/**
 * Hook for project role
 * This hook needs to be updated to properly detect project managers with different role formats
 */
export const useProjectRole = () => {
  const { project, user, isAdmin } = useAppData();

  // Check if the current user is a project manager
  const isProjectManager = (() => {
    // Admin users always have project manager privileges
    if (isAdmin) return true;

    // If no user or no project, return false
    if (!user || !project) return false;

    // Check if the user is a member of the project with the appropriate role
    const userMember = project.project_members?.find(
      member => member.user_id === user.id,
    );

    // Return true if the user has a role that indicates project management privileges
    // This is updated to handle different role formats in the data
    return userMember
      ? ["admin", "owner", "pm", "project_manager"].includes(
          userMember.role ?? "",
        )
      : false;
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
