"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import {
  InvitationResponse,
  ProjectInvitationWithProfile,
  ProjectWithDetails,
} from "@/types/project.types";
import slugify from "slugify";

type Project = Tables<"projects">;

interface CreateProjectInput {
  name: string;
  description?: string | null;
  prefix: string;
  slug: string;
}

export const createProjectAction = async (
  project: CreateProjectInput,
): Promise<ActionResponse<ProjectWithDetails>> => {
  const actionName = "createProjectAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    conditionalLog(actionName, { userData: user, userError }, true);
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase.rpc("create_project_with_owner", {
      p_name: project.name,
      p_description: project.description || "",
      p_prefix: project.prefix,
      p_slug: project.slug,
      p_owner_id: user.id,
    });

    conditionalLog(actionName, { data, error }, true);
    if (error) throw error;

    return getActionResponse({
      data: data as any as ProjectWithDetails,
    });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const updateProjectAction = async (
  projectId: string,
  updates: TablesUpdate<"projects">,
): Promise<ActionResponse<ProjectWithDetails>> => {
  const actionName = "updateProjectAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId)
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
      .single();

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;

    // Transform nested objects
    const transformedProject = {
      ...data,
      project_members: data.project_members?.map(member => ({
        ...member,
        profile: member.profile?.[0] || null,
      })),
      project_invitations: data.project_invitations?.map(invitation => ({
        ...invitation,
        inviter: invitation.inviter?.[0] || null,
      })),
    };

    return getActionResponse({ data: transformedProject });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const deleteProjectAction = async (
  projectId: string,
): Promise<ActionResponse<null>> => {
  const actionName = "deleteProjectAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: memberData, error: memberError } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("role", "owner")
      .single();

    conditionalLog(actionName, { memberData, memberError }, true);

    if (memberError || !memberData) {
      throw new Error("Permission denied");
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    conditionalLog(actionName, { error }, true);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const getProjectAction = async (
  projectSlug: string,
): Promise<ActionResponse<ProjectWithDetails>> => {
  const actionName = "getProjectAction";
  const supabase = await getSupabaseServerActionClient();
  console.log("projectSlug", projectSlug);

  try {
    const { data, error } = await supabase.rpc("get_project_data", {
      project_slug: projectSlug,
    });
    conditionalLog(actionName, { data, error }, true);

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Project not found");
    }

    return getActionResponse({ data: data as any as ProjectWithDetails });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const listProjectsAction = async (filters?: {
  status?: Project["status"];
  search?: string;
  sort?: keyof Project;
  order?: "asc" | "desc";
}): Promise<ActionResponse<ProjectWithDetails[]>> => {
  const actionName = "listProjectsAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase.rpc("list_projects", {
      p_status: filters?.status || undefined,
      p_search: filters?.search || undefined,
      p_sort_column: filters?.sort || undefined,
      p_sort_order: filters?.order || undefined,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;

    // Assert the type since we know the DB function returns data matching ProjectWithDetails
    return getActionResponse({
      data: (data || []) as any as ProjectWithDetails[],
    });
  } catch (error) {
    conditionalLog(actionName, { error });
    return getActionResponse({ error });
  }
};

export const getProjectSlugAction = async (
  projectName: string,
): Promise<ActionResponse<string>> => {
  const actionName = "getProjectSlugAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase.rpc("generate_unique_slug", {
      base_slug: slugify(projectName).toLowerCase(),
      table_name: "projects",
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;
    return getActionResponse({ data });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const inviteMemberAction = async (
  invitation: TablesInsert<"project_invitations">,
): Promise<InvitationResponse> => {
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

    return getActionResponse({
      data: data as any as ProjectInvitationWithProfile,
    });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
