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

    // Insert project
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .insert(project)
      .select()
      .single();

    if (projectError) throw projectError;

    // Add creator as project owner
    const { error: memberError } = await supabase
      .from("project_members")
      .insert({
        project_id: projectData.id,
        user_id: userData.user.id,
        role: "owner",
      });

    if (memberError) throw memberError;

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
