"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { UserInvites } from "@/types/invites.types";
import { ProjectInvitationWithProfile } from "@/types/project.types";

export const getUserInvitesAction = async (): Promise<
  ActionResponse<UserInvites>
> => {
  const actionName = "getUserInvitesAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc("get_user_invites", {
      p_email: user.email,
    });

    conditionalLog(actionName, { data, error }, true);
    if (error) throw error;

    return getActionResponse({ data: data as any as UserInvites });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const respondToInvitationAction = async (
  invitationId: string,
  accept: boolean,
): Promise<ActionResponse<ProjectInvitationWithProfile>> => {
  const actionName = "respondToInvitationAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc("handle_invitation_response", {
      p_invitation_id: invitationId,
      p_user_id: user.id,
      p_accept: accept,
    });

    conditionalLog(actionName, { data, error }, true);
    if (error) throw error;

    return getActionResponse({
      data: data as any as ProjectInvitationWithProfile,
    });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const deleteInvitationAction = async (
  invitationId: string,
): Promise<ActionResponse<null>> => {
  const actionName = "deleteInvitationAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) throw new Error("Not authenticated");

    const { error } = await supabase.rpc("delete_project_invitation", {
      p_invitation_id: invitationId,
      p_user_id: user.id,
    });

    conditionalLog(actionName, { error }, true);
    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
