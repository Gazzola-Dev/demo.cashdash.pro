// member.actions.ts
"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { TablesInsert } from "@/types/database.types";

// Invite member action
export const inviteMemberAction = async (
  invitation: TablesInsert<"project_invitations">,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    // Verify current user has permission to invite
    const { data: memberData, error: memberError } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", invitation.project_id)
      .single();

    if (memberError || !["owner", "admin"].includes(memberData.role)) {
      throw new Error("Permission denied");
    }

    // Create invitation
    const { data, error } = await supabase
      .from("project_invitations")
      .insert(invitation)
      .select()
      .single();

    if (error) throw error;

    // TODO: Send invitation email

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Accept invitation action
// member.actions.ts
export const acceptInvitationAction = async (invitationId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    // Get and validate invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("project_invitations")
      .select()
      .eq("id", invitationId)
      .eq("status", "pending")
      .single();

    if (inviteError || !invitation) throw new Error("Invalid invitation");

    // Instead of RPC, let's handle this with regular transactions
    const { error: transactionError } = await supabase
      .from("project_members")
      .insert({
        project_id: invitation.project_id,
        user_id: userData.user.id,
        role: invitation.role,
      });

    if (!transactionError) {
      // Update invitation status
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

// Update member role action
export const updateMemberRoleAction = async (
  projectId: string,
  userId: string,
  newRole: string,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("project_members")
      .update({ role: newRole })
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Remove member action
export const removeMemberAction = async (projectId: string, userId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    // Verify not removing the last owner
    const { data: owners, error: ownerError } = await supabase
      .from("project_members")
      .select()
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

// List members action
export const listMembersAction = async (projectId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("project_members")
      .select(
        `
        *,
        user:profiles (
          id,
          display_name,
          avatar_url,
          professional_title
        )
      `,
      )
      .eq("project_id", projectId);

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// List invitations action
export const listInvitationsAction = async (projectId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("project_invitations")
      .select()
      .eq("project_id", projectId)
      .eq("status", "pending");

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};
