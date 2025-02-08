"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { Tables, TablesInsert } from "@/types/database.types";
import {
  ProfileResponse,
  ProfileWithDetails,
  UpdateProfileInput,
} from "@/types/profile.types";
import { ProjectWithDetails } from "@/types/project.types";

export const isProfileWithEmail = async (
  email: string,
): Promise<ActionResponse<boolean>> => {
  const actionName = "getProfileByEmailAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: profileExists, error: checkError } = await supabase.rpc(
      "check_profile_exists",
      { p_email: email },
    );

    if (checkError) throw checkError;
    return getActionResponse({ data: profileExists });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const getProfileAction = async (): Promise<ProfileResponse> => {
  const actionName = "getProfileAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) throw new Error("Not authenticated");

    // Remove the user_id parameter since the function uses auth.uid() internally
    const { data, error } = await supabase.rpc("get_profile_data");

    conditionalLog(actionName, { data, error }, true, 10);
    if (error) throw error;

    return getActionResponse({ data: data as any as ProfileWithDetails });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const updateProfileAction = async (
  updates: UpdateProfileInput,
): Promise<ProfileResponse> => {
  const actionName = "updateProfileAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    conditionalLog(actionName, { user, userError }, true);
    if (userError || !user) throw new Error("Not authenticated");

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    conditionalLog(actionName, { updateError }, true);
    if (updateError) throw updateError;

    // Get updated profile data
    return getProfileAction();
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

type Project = Tables<"projects">;

export const createProjectAction = async (
  project: TablesInsert<"projects">,
): Promise<ActionResponse<ProjectWithDetails>> => {
  const actionName = "createProjectAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    conditionalLog(actionName, { userData, userError }, true);

    if (!userData.user) throw new Error("User not authenticated");

    const { data: projectData, error: projectError } = await supabase.rpc(
      "create_project_with_owner",
      {
        project_data: project,
        owner_id: userData.user.id,
      },
    );

    conditionalLog(actionName, { projectData, projectError }, true);
    if (projectError) throw projectError;

    const { data: fullProject, error: fetchError } = await supabase
      .from("projects")
      .select(
        `
        *,
        project_members (
          *,
          profile:profiles!user_id(*)
        ),
        project_invitations (
          *,
          inviter:profiles!invited_by(*)
        ),
        tasks (*),
        external_integrations (*),
        project_metrics (*)
      `,
      )
      .eq("id", projectData.id)
      .single();

    conditionalLog(actionName, { fullProject, fetchError }, true);
    if (fetchError) throw fetchError;

    // Transform nested objects
    const transformedProject = {
      ...fullProject,
      project_members: fullProject.project_members?.map(member => ({
        ...member,
        profile: member.profile?.[0] || null,
      })),
      project_invitations: fullProject.project_invitations?.map(invitation => ({
        ...invitation,
        inviter: invitation.inviter?.[0] || null,
      })),
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ current_project_id: projectData.id })
      .eq("id", userData.user.id);

    conditionalLog(actionName, { profileError }, true);
    if (profileError) throw profileError;

    return getActionResponse({ data: transformedProject });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const inviteMemberAction = async (
  invitation: TablesInsert<"project_invitations">,
): Promise<ActionResponse<ProjectWithDetails>> => {
  const actionName = "inviteMemberAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    conditionalLog(actionName, { user, userError }, true);
    if (userError || !user) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc("invite_member_to_project", {
      p_project_id: invitation.project_id,
      p_inviter_id: user.id,
      p_email: invitation.email,
      p_role: invitation.role,
      p_expires_at:
        invitation.expires_at ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    conditionalLog(actionName, { data, error }, true);
    if (error) throw error;

    // Type cast the response from the DB function
    const inviteData = data as any as {
      invitation: any;
      project: { slug: string };
    };

    // After successful invitation, fetch updated project data
    const { data: projectData, error: projectError } = await supabase.rpc(
      "get_project_data",
      {
        project_slug: inviteData.project.slug,
      },
    );

    if (projectError) throw projectError;

    return getActionResponse({
      data: projectData as any as ProjectWithDetails,
    });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
