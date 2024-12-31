"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { ActionResponse } from "@/types/action.types";
import { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { ProjectListResponse, ProjectWithDetails } from "@/types/project.types";

type Project = Tables<"projects">;

export const createProjectAction = async (
  project: TablesInsert<"projects">,
): Promise<ActionResponse<ProjectWithDetails>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("User not authenticated");

    const { data: projectData, error: projectError } = await supabase.rpc(
      "create_project_with_owner",
      {
        project_data: project,
        owner_id: userData.user.id,
      },
    );

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

    if (fetchError) throw fetchError;

    // Transform the profile arrays into single objects
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

    if (profileError) throw profileError;

    return getActionResponse({ data: transformedProject });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const updateProjectAction = async (
  projectId: string,
  updates: TablesUpdate<"projects">,
): Promise<ActionResponse<ProjectWithDetails>> => {
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

    if (error) throw error;

    // Transform the profile arrays into single objects
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
    return getActionResponse({ error });
  }
};

export const deleteProjectAction = async (
  projectId: string,
): Promise<ActionResponse<null>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: memberData, error: memberError } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("role", "owner")
      .single();

    if (memberError || !memberData) {
      throw new Error("Permission denied");
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const getProjectAction = async (
  projectId: string,
): Promise<ActionResponse<ProjectWithDetails>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
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
      .eq("id", projectId)
      .single();

    if (error) throw error;

    // Transform the profile arrays into single objects
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
    return getActionResponse({ error });
  }
};

export const listProjectsAction = async (filters?: {
  status?: Project["status"];
  search?: string;
  sort?: keyof Project;
  order?: "asc" | "desc";
}): Promise<ProjectListResponse> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    let query = supabase.from("projects").select(`
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
    `);

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    if (filters?.sort) {
      query = query.order(filters.sort, { ascending: filters.order === "asc" });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform the profile arrays into single objects for each project
    const transformedProjects = data?.map(project => ({
      ...project,
      project_members: project.project_members?.map(member => ({
        ...member,
        profile: member.profile?.[0] || null,
      })),
      project_invitations: project.project_invitations?.map(invitation => ({
        ...invitation,
        inviter: invitation.inviter?.[0] || null,
      })),
    }));

    return getActionResponse({ data: transformedProjects });
  } catch (error) {
    return getActionResponse({ error });
  }
};
