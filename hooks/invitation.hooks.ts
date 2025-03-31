"use client";

import { useToast } from "@/hooks/use-toast";
import { conditionalLog } from "@/lib/log.utils";
import { useAppData } from "@/stores/app.store";
import { useCallback, useState } from "react";

/**
 * Hook to get pending invitations for a user
 */
export const useGetUserPendingInvitations = () => {
  const hookName = "useGetUserPendingInvitations";
  const { profile, userInvitations } = useAppData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch pending invitations
  const getUserPendingInvitations = useCallback(async () => {
    const email = profile?.email;
    setIsLoading(true);
    setError(null);

    try {
      if (!email) {
        setIsLoading(false);
        return [];
      }

      // In a real implementation, this would call an API
      // For now, we'll just return the mock data from the store
      conditionalLog(
        hookName,
        { data: userInvitations, error: null },
        false,
        null,
      );
      return userInvitations || [];
    } catch (err) {
      const errorMessage = "Failed to load invitations";
      setError(errorMessage);
      conditionalLog(
        hookName,
        { data: null, error: errorMessage },
        false,
        null,
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [profile?.email, userInvitations]);

  return {
    data: userInvitations,
    isLoading,
    error,
    getUserPendingInvitations,
  };
};

/**
 * Hook to handle invitation responses (accept/decline)
 */
export const useHandleInvitationResponse = () => {
  const hookName = "useHandleInvitationResponse";
  const { toast } = useToast();
  const {
    userInvitations,
    setUserInvitations,
    projects,
    setProjects,
    setProject,
  } = useAppData();
  const [isPending, setIsPending] = useState(false);

  const handleInvitationResponse = useCallback(
    (invitationId: string, accept: boolean) => {
      conditionalLog(hookName, { invitationId, accept }, false, null);
      setIsPending(true);

      try {
        // Find the invitation in the user invitations
        const invitation = userInvitations.find(
          inv => inv.invitation?.id === invitationId,
        );

        if (!invitation) {
          throw new Error("Invitation not found");
        }

        const project = invitation.project;

        // Remove the invitation from user invitations
        const updatedInvitations = userInvitations.filter(
          inv => inv.invitation?.id !== invitationId,
        );
        setUserInvitations(updatedInvitations);

        if (accept) {
          // If accepted, add the project to the user's projects if it's not already there
          const projectExists = projects.some(p => p.id === project?.id);

          if (!projectExists && project) {
            // Add the project to the user's projects
            setProjects([...projects, project]);

            // Set as current project
            setProject({
              ...project,
              project_members: [], // In a real implementation, this would be populated
              project_invitations: [],
            });
          }
        }

        // Show toast notification
        const action = accept ? "accepted" : "declined";
        toast({
          title: `Invitation ${action}`,
          description: accept
            ? `You are now a member of ${project?.name || "the project"}.`
            : `You have declined the invitation to ${project?.name || "the project"}.`,
        });

        conditionalLog(
          hookName,
          { data: { project, success: true }, error: null },
          false,
          null,
        );
        return { project, success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to process invitation";
        toast({
          title: "Failed to process invitation",
          description: errorMessage,
          variant: "destructive",
        });
        conditionalLog(
          hookName,
          { data: null, error: errorMessage },
          false,
          null,
        );
        return { project: null, success: false };
      } finally {
        setIsPending(false);
      }
    },
    [
      userInvitations,
      setUserInvitations,
      projects,
      setProjects,
      setProject,
      toast,
    ],
  );

  return {
    handleInvitationResponse,
    isPending,
  };
};
