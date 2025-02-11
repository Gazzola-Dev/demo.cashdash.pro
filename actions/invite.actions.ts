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

interface InvitationResponse {
  invitationId: string;
  accept: boolean;
}

export const respondToInvitationAction = async ({
  invitationId,
  accept,
}: InvitationResponse): Promise<
  ActionResponse<ProjectInvitationWithProfile>
> => {
  const actionName = "respondToInvitationAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) throw new Error("Not authenticated");

    // First handle the invitation response
    const { data, error } = await supabase.rpc("handle_invitation_response", {
      p_invitation_id: invitationId,
      p_user_id: user.id,
      p_accept: accept,
    });
    const typedData = data as any as ProjectInvitationWithProfile;

    conditionalLog(actionName, { data, error }, true);
    if (error) throw error;

    // If the invitation was accepted, update the user's current project
    if (accept && typedData.id) {
      const { error: updateError } = await supabase.rpc(
        "set_user_current_project",
        {
          p_user_id: user.id,
          p_project_id: typedData.id,
        },
      );

      if (updateError) {
        conditionalLog(actionName, { updateError }, true);
        throw updateError;
      }
    }

    return getActionResponse({
      data: typedData,
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
