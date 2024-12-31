"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
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
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: memberData, error: memberError } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", invitation.project_id)
      .single();

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
    return getActionResponse({ error });
  }
};

export const acceptInvitationAction = async (
  invitationId: string,
): Promise<ActionResponse<null>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const { data: invitation, error: inviteError } = await supabase
      .from("project_invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("status", "pending")
      .single();

    if (inviteError || !invitation) throw new Error("Invalid invitation");

    const { error: transactionError } = await supabase
      .from("project_members")
      .insert({
        project_id: invitation.project_id,
        user_id: userData.user.id,
        role: invitation.role,
      });

    if (!transactionError) {
      await supabase
        .from("project_invitations")
        .update({ status: "accepted" })
        .eq("id", invitationId);
    }

    if (transactionError) throw transactionError;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const updateMemberRoleAction = async (
  projectId: string,
  userId: string,
  newRole: string,
): Promise<MemberResponse> => {
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
    return getActionResponse({ error });
  }
};

export const removeMemberAction = async (
  projectId: string,
  userId: string,
): Promise<ActionResponse<null>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: owners, error: ownerError } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", projectId)
      .eq("role", "owner");

    if (ownerError) throw ownerError;

    if (owners.length === 1 && owners[0].user_id === userId) {
      throw new Error("Cannot remove the last owner");
    }

    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const listMembersAction = async (
  projectId: string,
): Promise<MemberListResponse> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("project_members")
      .select(
        `
        *,
        profile:profiles!user_id(*),
        project:projects(*)
      `,
      )
      .eq("project_id", projectId);

    if (error) throw error;

    const transformedData = data
      .filter(member => member.project && member.profile)
      .map(member => ({
        ...member,
        profile: Array.isArray(member.profile)
          ? member.profile[0]
          : member.profile,
        project: member.project!,
      }));

    return getActionResponse({ data: transformedData });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const listInvitationsAction = async (
  projectId: string,
): Promise<ActionResponse<ProjectInvitation[]>> => {
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
    return getActionResponse({ error });
  }
};
