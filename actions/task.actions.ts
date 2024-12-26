// task.actions.ts
"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { TablesInsert, TablesUpdate } from "@/types/database.types";

// Create task action
export const createTaskAction = async (task: TablesInsert<"tasks">) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    // Verify project exists and user has access
    const { data: projectData, error: projectError } = await supabase
      .from("project_members")
      .select()
      .eq("project_id", task.project_id)
      .single();

    if (projectError) throw new Error("Project access denied");

    // Insert task - note ordinal_id is handled by trigger
    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select()
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Update task action
export const updateTaskAction = async (
  taskId: string,
  updates: TablesUpdate<"tasks">,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Delete task action
export const deleteTaskAction = async (taskId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Get task action
export const getTaskAction = async (taskId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        project:projects (
          id,
          name,
          slug
        ),
        subtasks (
          *
        ),
        task_tags (
          tag_id,
          tags (
            *
          )
        ),
        comments (
          *,
          user:profiles (
            id,
            display_name,
            avatar_url
          )
        ),
        task_schedule (
          *
        ),
        attachments (
          *
        )
      `,
      )
      .eq("id", taskId)
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// List tasks action
export const listTasksAction = async (filters?: {
  projectId?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    let query = supabase.from("tasks").select(`
        *,
        project:projects (
          id,
          name,
          slug
        ),
        subtasks (
          count
        ),
        task_tags (
          tags (
            *
          )
        )
      `);

    // Apply filters
    if (filters?.projectId) {
      query = query.eq("project_id", filters.projectId);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.priority) {
      query = query.eq("priority", filters.priority);
    }
    if (filters?.assignee) {
      query = query.eq("assignee", filters.assignee);
    }
    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      );
    }

    // Apply sorting
    if (filters?.sort) {
      query = query.order(filters.sort, { ascending: filters.order === "asc" });
    } else {
      query = query.order("ordinal_id", { ascending: true });
    }

    const { data, error } = await query;

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const reorderTasksAction = async (
  projectId: string,
  taskIds: string[],
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    // Update each task's ordinal_id based on new order
    const updates = taskIds.map((id, index) => ({
      id,
      ordinal_id: index + 1,
      // Add required fields with their current values
      project_id: projectId,
      prefix: "", // Will be preserved by upsert
      slug: "", // Will be preserved by upsert
      title: "", // Will be preserved by upsert
    }));

    const { error } = await supabase
      .from("tasks")
      .upsert(updates, { onConflict: "id" });

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};
