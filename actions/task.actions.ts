// task.actions.ts
"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { TablesInsert, TablesUpdate } from "@/types/database.types";
import {
  TaskListResponse,
  TaskResponse,
  TaskWithProfile,
} from "@/types/task.types";

// Create task action
export const createTaskAction = async (
  task: TablesInsert<"tasks">,
): Promise<TaskResponse> => {
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
      .select(
        `
        *,
        project:projects (
          id,
          name,
          slug
        )
      `,
      )
      .single();

    if (error) throw error;

    // Safely cast data since we know the shape matches our type
    return getActionResponse({ data: data as unknown as TaskWithProfile });
  } catch (error) {
    return getActionResponse<TaskWithProfile>({ error });
  }
};

// Update task action
export const updateTaskAction = async (
  taskId: string,
  updates: TablesUpdate<"tasks">,
): Promise<TaskResponse> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .select(
        `
        *,
        project:projects (
          id,
          name,
          slug
        )
      `,
      )
      .single();

    if (error) throw error;

    return getActionResponse({ data: data as unknown as TaskWithProfile });
  } catch (error) {
    return getActionResponse<TaskWithProfile>({ error });
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
export const getTaskAction = async (taskId: string): Promise<TaskResponse> => {
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

    // Create base task with correct typing
    const taskWithProfile = data as unknown as TaskWithProfile;

    // If there's an assignee, fetch their profile separately
    if (data.assignee) {
      const { data: assigneeProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", data.assignee)
        .single();

      if (!profileError && assigneeProfile) {
        taskWithProfile.assignee_profile = assigneeProfile;
      }
    }

    return getActionResponse({ data: taskWithProfile });
  } catch (error) {
    return getActionResponse<TaskWithProfile>({ error });
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
}): Promise<TaskListResponse> => {
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

    // Cast the data with unknown first to safely convert to our type
    const tasksWithProfiles = data as unknown as TaskWithProfile[];

    // Fetch assignee profiles for tasks that have assignees
    const assigneeIds = tasksWithProfiles
      .filter(task => task.assignee)
      .map(task => task.assignee);

    if (assigneeIds.length > 0) {
      const { data: assigneeProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", assigneeIds);

      if (!profileError && assigneeProfiles) {
        const profileMap = new Map(
          assigneeProfiles.map(profile => [profile.id, profile]),
        );

        tasksWithProfiles.forEach(task => {
          if (task.assignee) {
            task.assignee_profile = profileMap.get(task.assignee) || null;
          }
        });
      }
    }

    return getActionResponse({ data: tasksWithProfiles });
  } catch (error) {
    return getActionResponse<TaskWithProfile[]>({ error });
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
