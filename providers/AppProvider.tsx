"use client";

import { useGetAppData, useGetTask, useUpdateProfile } from "@/hooks/app.hooks";
import { useHandleInvitationResponse } from "@/hooks/invitation.hooks";
import { useDialogQueue } from "@/hooks/useDialogQueue";
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

  const { refetch: refetchTask } = useGetTask(secondSegment);
  const { refetch: refetchAppData } = useGetAppData();
  const { updateProfile } = useUpdateProfile();
  const { dialog } = useDialogQueue();
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
    },
    [handleInvitationResponse],
  );

  const onDeclineInvitation = useCallback(
    (invitationId: string) => {
      handleInvitationResponse(invitationId, false);
    },
    [handleInvitationResponse],
  );

  // // Set up real-time monitoring of invitation changes
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

  // // Refetch invitations when the user signs in or when invitations change
  // const {
  //   refetch: refetchInvitations,
  //   isSuccess: isGetInvitationsSuccess,
  //   data: pendingInvitations,
  // } = useGetUserPendingInvitations();

  // // Queue dialogs for pending invitations
  // useEffect(() => {
  //   if (
  //     !pendingInvitations ||
  //     pendingInvitations.length === 0 ||
  //     isInvitationResponsePending
  //   )
  //     return;

  //   // Process each pending invitation with a dialog
  //   pendingInvitations.forEach(invitation => {
  //     dialog({
  //       title: "Project Invitation",
  //       description: `You've been invited to join "${invitation.project?.name || "a project"}"${invitation.sender_profile.display_name ? ` by ${invitation.sender_profile.display_name}` : ""}.`,
  //       confirmText: "Accept",
  //       cancelText: "Decline",
  //       onConfirm: () => onAcceptInvitation(invitation.invitation.id),
  //       onCancel: () => onDeclineInvitation(invitation.invitation.id),
  //     });
  //   });
  // }, [
  //   pendingInvitations,
  //   dialog,
  //   onAcceptInvitation,
  //   onDeclineInvitation,
  //   isInvitationResponsePending,
  // ]);

  // useEffect(() => {
  //   hasInitialInvitationsRef.current = true;
  // }, [isGetInvitationsSuccess]);

  // Handle auth state changes
  const handleSignIn = useCallback(
    (session: Session | null) => {
      if (session?.user) {
        setUser(session.user);
        refetchAppData();
        // refetchInvitations(); // Fetch invitations when user signs in
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

  return <>{children}</>;
};

export default AppProvider;
