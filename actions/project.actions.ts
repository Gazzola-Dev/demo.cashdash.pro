// project.actions.ts
"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { TablesInsert, TablesUpdate } from "@/types/database.types";

// Create project action
export const createProjectAction = async (
  project: TablesInsert<"projects">,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("User not authenticated");

    // Start a transaction to ensure both operations succeed or fail together
    const { data: projectData, error: projectError } = await supabase.rpc(
      "create_project_with_owner",
      {
        project_data: project,
        owner_id: userData.user.id,
      },
    );

    if (projectError) throw projectError;

    return getActionResponse({ data: projectData });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Update project action
export const updateProjectAction = async (
  projectId: string,
  updates: TablesUpdate<"projects">,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId)
      .select()
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Delete project action
export const deleteProjectAction = async (projectId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
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

// Get project action
export const getProjectAction = async (projectId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("projects")
      .select(
        `
        *,
        project_members (
          user_id,
          role
        ),
        tasks (
          id,
          title,
          status
        )
      `,
      )
      .eq("id", projectId)
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// List projects action
export const listProjectsAction = async (filters?: {
  status?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    let query = supabase.from("projects").select(`
        *,
        project_members (
          user_id,
          role
        ),
        tasks (
          count
        )
      `);

    // Apply filters
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    // Apply sorting
    if (filters?.sort) {
      query = query.order(filters.sort, { ascending: filters.order === "asc" });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};
