"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { ProjectWithDetails } from "@/types/project.types";

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

    conditionalLog(actionName, { data, error });

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
