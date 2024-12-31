"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { ActionResponse } from "@/types/action.types";
import { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { TaskFilters } from "@/types/task.types";

type Task = Tables<"tasks">;
type Project = Tables<"projects">;
type Profile = Tables<"profiles">;
type Subtask = Tables<"subtasks">;
type TaskTag = Tables<"task_tags">;
type Tag = Tables<"tags">;
type Comment = Tables<"comments">;
type TaskSchedule = Tables<"task_schedule">;
type Attachment = Tables<"attachments">;

interface TaskWithDetails extends Task {
  project: Project;
  assignee_profile?: Profile | null;
  subtasks?: Subtask[];
  task_tags?: (TaskTag & { tags: Tag })[];
  comments?: (Omit<Comment, "user"> & {
    user: Profile[];
  })[];
  task_schedule?: TaskSchedule[];
  attachments?: Attachment[];
}

export const createTaskAction = async (
  task: TablesInsert<"tasks">,
): Promise<ActionResponse<TaskWithDetails>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: projectData, error: projectError } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", task.project_id)
      .single();

    if (projectError) throw new Error("Project access denied");

    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select(
        `
        *,
        project:projects (*)
      `,
      )
      .single();

    if (error) throw error;

    return getActionResponse({ data: data as TaskWithDetails });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const updateTaskAction = async (
  taskId: string,
  updates: TablesUpdate<"tasks">,
): Promise<ActionResponse<TaskWithDetails>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .select(
        `
        *,
        project:projects (*)
      `,
      )
      .single();

    if (error) throw error;

    return getActionResponse({ data: data as TaskWithDetails });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const deleteTaskAction = async (
  taskId: string,
): Promise<ActionResponse<null>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const getTaskAction = async (
  taskId: string,
): Promise<ActionResponse<TaskWithDetails>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        project:projects (*),
        subtasks (*),
        task_tags (
          *,
          tags (*)
        ),
        comments (
          *,
          user:profiles (*)
        ),
        task_schedule (*),
        attachments (*)
      `,
      )
      .eq("id", taskId)
      .single();

    if (error) throw error;

    const taskWithDetails = { ...data } as TaskWithDetails;

    if (data.assignee) {
      const { data: assigneeProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.assignee);

      if (!profileError && assigneeProfiles && assigneeProfiles.length > 0) {
        taskWithDetails.assignee_profile = assigneeProfiles[0];
      }
    }

    // No need to transform comments as we've updated the interface to expect arrays

    return getActionResponse({ data: taskWithDetails });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const listTasksAction = async (
  filters?: TaskFilters,
): Promise<ActionResponse<TaskWithDetails[]>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    let query = supabase.from("tasks").select(`
        *,
        project:projects (*),
        subtasks (count),
        task_tags (
          tags (*)
        )
      `);

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

    if (filters?.sort) {
      query = query.order(filters.sort, { ascending: filters.order === "asc" });
    } else {
      query = query.order("ordinal_id", { ascending: true });
    }

    const { data, error } = await query;

    if (error) throw error;

    const tasksWithDetails = data as unknown as TaskWithDetails[];

    const assigneeIds = tasksWithDetails
      .filter(task => task.assignee)
      .map(task => task.assignee!);

    if (assigneeIds.length > 0) {
      const { data: assigneeProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", assigneeIds);

      if (!profileError && assigneeProfiles) {
        const profileMap = new Map(
          assigneeProfiles.map(profile => [profile.id, profile]),
        );

        tasksWithDetails.forEach(task => {
          if (task.assignee) {
            task.assignee_profile = profileMap.get(task.assignee) || null;
          }
        });
      }
    }

    return getActionResponse({ data: tasksWithDetails });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const reorderTasksAction = async (
  projectId: string,
  taskIds: string[],
): Promise<ActionResponse<null>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const updates = taskIds.map((id, index) => ({
      id,
      ordinal_id: index + 1,
      project_id: projectId,
      prefix: "",
      slug: "",
      title: "",
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
