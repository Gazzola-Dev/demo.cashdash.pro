"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { Tables, TablesInsert } from "@/types/database.types";
import {
  InvitationResponse,
  MemberListResponse,
  MemberResponse,
} from "@/types/member.types";

type ProjectMember = Tables<"project_members">;
type ProjectInvitation = Tables<"project_invitations">;

export const inviteMemberAction = async (
  invitation: TablesInsert<"project_invitations">,
): Promise<InvitationResponse> => {
  const actionName = "inviteMemberAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: memberData, error: memberError } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", invitation.project_id)
      .single();

    conditionalLog(actionName, { memberData, memberError }, true);

    if (memberError || !["owner", "admin"].includes(memberData.role)) {
      throw new Error("Permission denied");
    }

    const { data, error } = await supabase
      .from("project_invitations")
      .insert(invitation)
      .select(
        `
        *,
        inviter:profiles!invited_by(*),
        project:projects(*)
      `,
      )
      .single();

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;
    if (!data.project) throw new Error("Project not found");
    if (
      !data.inviter ||
      (Array.isArray(data.inviter) && !data.inviter.length)
    ) {
      throw new Error("Inviter not found");
    }

    const transformedData = {
      ...data,
      inviter: Array.isArray(data.inviter) ? data.inviter[0] : data.inviter,
      project: data.project,
    };

    return getActionResponse({ data: transformedData });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const acceptInvitationAction = async (
  invitationId: string,
): Promise<ActionResponse<null>> => {
  const actionName = "acceptInvitationAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    conditionalLog(actionName, { userData, userError }, true);

    if (!userData.user) throw new Error("Not authenticated");

    const { data: invitation, error: inviteError } = await supabase
      .from("project_invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("status", "pending")
      .single();

    conditionalLog(actionName, { invitation, inviteError }, true);

    if (inviteError || !invitation) throw new Error("Invalid invitation");

    const { error: transactionError } = await supabase
      .from("project_members")
      .insert({
        project_id: invitation.project_id,
        user_id: userData.user.id,
        role: invitation.role,
      });

    conditionalLog(actionName, { transactionError }, true);

    if (!transactionError) {
      const { error: updateError } = await supabase
        .from("project_invitations")
        .update({ status: "accepted" })
        .eq("id", invitationId);

      conditionalLog(actionName, { updateError }, true);
    }

    if (transactionError) throw transactionError;

    return getActionResponse({ data: null });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const updateMemberRoleAction = async (
  projectId: string,
  userId: string,
  newRole: string,
): Promise<MemberResponse> => {
  const actionName = "updateMemberRoleAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("project_members")
      .update({ role: newRole })
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .select(
        `
        *,
        profile:profiles!user_id(*),
        project:projects(*)
      `,
      )
      .single();

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;
    if (!data.project) throw new Error("Project not found");
    if (
      !data.profile ||
      (Array.isArray(data.profile) && !data.profile.length)
    ) {
      throw new Error("Profile not found");
    }

    const transformedData = {
      ...data,
      profile: Array.isArray(data.profile) ? data.profile[0] : data.profile,
      project: data.project,
    };

    return getActionResponse({ data: transformedData });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const removeMemberAction = async (
  projectId: string,
  userId: string,
): Promise<ActionResponse<null>> => {
  const actionName = "removeMemberAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: owners, error: ownerError } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", projectId)
      .eq("role", "owner");

    conditionalLog(actionName, { owners, ownerError }, true);

    if (ownerError) throw ownerError;

    if (owners.length === 1 && owners[0].user_id === userId) {
      throw new Error("Cannot remove the last owner");
    }

    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId);

    conditionalLog(actionName, { error }, true);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const listMembersAction = async (
  projectSlug: string,
): Promise<MemberListResponse> => {
  const actionName = "listMembersAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase.rpc("list_project_members", {
      project_slug: projectSlug,
    });

    conditionalLog(actionName, { data, error }, true, null);

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Members not found");
    }

    const transformedData = (data as any[])
      .filter(result => result.member && result.profile)
      .map(result => ({
        ...result.member,
        project: result.project,
        profile: result.profile,
      }));

    return getActionResponse({ data: transformedData });
  } catch (error) {
    conditionalLog(actionName, { error });
    return getActionResponse({ error });
  }
};

export const listInvitationsAction = async (
  projectId: string,
): Promise<ActionResponse<ProjectInvitation[]>> => {
  const actionName = "listInvitationsAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("project_invitations")
      .select(
        `
        *,
        inviter:profiles!invited_by(*),
        project:projects(*)
      `,
      )
      .eq("project_id", projectId)
      .eq("status", "pending");

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;

    const transformedData = data
      .filter(invitation => invitation.project && invitation.inviter)
      .map(invitation => ({
        ...invitation,
        inviter: Array.isArray(invitation.inviter)
          ? invitation.inviter[0]
          : invitation.inviter,
        project: invitation.project!,
      }));

    return getActionResponse({ data: transformedData });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
