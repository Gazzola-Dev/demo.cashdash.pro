"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { ProjectInvitationWithDetails } from "@/types/app.types";

// Get pending invitations for the current user by email
export const getUserPendingInvitationsAction = async (
  email: string,
): Promise<ActionResponse<ProjectInvitationWithDetails[]>> => {
  const actionName = "getUserPendingInvitationsAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    const { data, error } = await supabase.rpc("get_user_pending_invitations", {
      p_email: email,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;

    return getActionResponse({
      data: data as any as ProjectInvitationWithDetails[],
    });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

// Handle invitation response (accept/decline)
export const handleInvitationResponseAction = async (
  invitationId: string,
  accept: boolean,
): Promise<ActionResponse<any>> => {
  const actionName = "handleInvitationResponseAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    // Call the handle_invitation_response RPC
    const { data, error } = await supabase.rpc("handle_invitation_response", {
      p_invitation_id: invitationId,
      p_user_id: user.id,
      p_accept: accept,
    });

    conditionalLog(actionName, { data, error }, true, null);

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
