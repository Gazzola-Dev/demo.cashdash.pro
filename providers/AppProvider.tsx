"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetAppData, useGetTask, useUpdateProfile } from "@/hooks/app.hooks";
import { useHandleInvitationResponse } from "@/hooks/invitation.hooks";
import useSupabase from "@/hooks/useSupabase";
import { useAppStore } from "@/stores/app.store";
import { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  const firstSegment = pathSegments[0];
  const secondSegment = pathSegments[1];

  const supabase = useSupabase();
  const {
    projects,
    profile,
    tasks,
    task,
    setTask,
    setProject,
    setUser,
    reset,
    setMilestone,
    project,
    userInvitations,
    user,
  } = useAppStore();

  // State for handling invitation dialogs
  const [currentInvitationIndex, setCurrentInvitationIndex] =
    useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const { refetch: refetchTask } = useGetTask(secondSegment);
  const { refetch: refetchAppData } = useGetAppData();
  const { updateProfile } = useUpdateProfile();
  const { handleInvitationResponse, isPending: isInvitationResponsePending } =
    useHandleInvitationResponse();
  const queryClient = useQueryClient();

  // References to track invitation refetch state
  const hasInitialInvitationsRef = useRef(false);
  const isProcessingInviteChangeRef = useRef(false);

  // Callback function for invitation responses
  const onAcceptInvitation = useCallback(
    (invitationId: string) => {
      handleInvitationResponse(invitationId, true);
      setIsDialogOpen(false);

      // Move to the next invitation if available
      if (currentInvitationIndex < userInvitations.length - 1) {
        setCurrentInvitationIndex(prevIndex => prevIndex + 1);
      }
    },
    [handleInvitationResponse, currentInvitationIndex, userInvitations.length],
  );

  const onDeclineInvitation = useCallback(
    (invitationId: string) => {
      handleInvitationResponse(invitationId, false);
      setIsDialogOpen(false);

      // Move to the next invitation if available
      if (currentInvitationIndex < userInvitations.length - 1) {
        setCurrentInvitationIndex(prevIndex => prevIndex + 1);
      }
    },
    [handleInvitationResponse, currentInvitationIndex, userInvitations.length],
  );

  // Show invitation dialog when there are invitations available
  useEffect(() => {
    if (
      userInvitations &&
      userInvitations.length > 0 &&
      !isInvitationResponsePending
    ) {
      setIsDialogOpen(true);
    } else {
      setIsDialogOpen(false);
    }
  }, [userInvitations, isInvitationResponsePending]);

  // Reset the invitation index when invitations change
  useEffect(() => {
    if (userInvitations && userInvitations.length === 0) {
      setCurrentInvitationIndex(0);
    }
  }, [userInvitations]);

  // Set up real-time monitoring of invitation changes
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const email = profile?.email;
    if (!supabase || !email || isListening) return;

    // Subscribe to the invitation_change channel
    const channel = supabase
      .channel("invitation_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_invitations",
          filter: `email=eq.${email}`,
        },
        payload => {
          // Invalidate the pending invitations query to fetch fresh data
          console.count("test");
          queryClient.invalidateQueries({
            queryKey: ["pendingInvitations", email],
          });
        },
      )
      .subscribe(status => {
        setIsListening(true);
      });

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, profile?.email, isListening, queryClient]);

  // Handle auth state changes
  const handleSignIn = useCallback(
    (session: Session | null) => {
      if (session?.user) {
        setUser(session.user);
        refetchAppData();
      }
    },
    [setUser, refetchAppData],
  );

  const handleSignOut = useCallback(() => {
    reset();
    // Reset invitation flags
    hasInitialInvitationsRef.current = false;
  }, [reset]);

  // Handle auth state changes
  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        handleSignIn(session);
      } else if (event === "SIGNED_OUT") {
        handleSignOut();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleSignIn, handleSignOut, supabase]);

  // Handle project switch and current project update
  useEffect(() => {
    if (!firstSegment || !projects?.length) return;

    const matchingProject = projects.find(p => p.slug === firstSegment);
    if (matchingProject && matchingProject.id !== profile?.current_project_id) {
      setProject({
        ...matchingProject,
        project_members: [],
        project_invitations: [],
      });
      updateProfile({ current_project_id: matchingProject.id });
      setTask(null);

      // Reset current milestone when changing project
      setMilestone(null);

      // Refetch app data to get the correct milestone for the new project
      refetchAppData();
    }
  }, [
    firstSegment,
    projects,
    setProject,
    profile,
    updateProfile,
    setTask,
    setMilestone,
    refetchAppData,
  ]);

  // Handle task loading based on URL segments
  useEffect(() => {
    if (!firstSegment || !secondSegment || !profile || !tasks?.length) return;

    // Check if we're in the current project path
    const isCurrentProject =
      profile.current_project_id &&
      projects?.find(
        p => p.id === profile.current_project_id && p.slug === firstSegment,
      );

    if (!isCurrentProject) return;

    // Try to find task by ordinal_id first
    const ordinalId = parseInt(secondSegment, 10);
    let matchingTask = !isNaN(ordinalId)
      ? tasks.find(t => t.ordinal_id === ordinalId)
      : tasks.find(t => t.slug === secondSegment);

    if (matchingTask && matchingTask.id !== task?.id) {
      setTask({
        ...matchingTask,
        comments: [],
        subtasks: [],
        assignee_profile: null,
      });
      refetchTask();
    }
  }, [
    firstSegment,
    secondSegment,
    profile,
    tasks,
    projects,
    setTask,
    refetchTask,
    task,
  ]);

  // Get the current invitation
  const currentInvitation = userInvitations[currentInvitationIndex];

  return (
    <>
      {children}

      {/* Invitation Dialog */}
      {currentInvitation && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Project Invitation</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              You&apos;ve been invited to join{" "}
              <span className="font-semibold">
                {currentInvitation.project?.name || "a project"}
              </span>
              .
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  onDeclineInvitation(currentInvitation.invitation.id)
                }
                disabled={isInvitationResponsePending}
              >
                Decline
              </Button>
              <Button
                onClick={() =>
                  onAcceptInvitation(currentInvitation.invitation.id)
                }
                disabled={isInvitationResponsePending}
              >
                Accept
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AppProvider;
