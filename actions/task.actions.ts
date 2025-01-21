"use server";
import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { ActionResponse } from "@/types/action.types";
import { TablesInsert, TablesUpdate } from "@/types/database.types";
import { TaskFilters, TaskResult } from "@/types/task.types";

export const listTasksAction = async (
  filters?: TaskFilters,
): Promise<ActionResponse<TaskResult[]>> => {
  const supabase = await getSupabaseServerActionClient();

  if (!filters?.projectSlug) throw new Error("Project slug is required");

  try {
    // TODO: implement filtering, sorting, and pagination
    const { data, error } = await supabase.rpc("list_project_tasks", {
      project_slug: filters?.projectSlug,
    });

    if (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }

    if (!data) {
      console.error("No data returned for project tasks");
      throw new Error("Tasks not found");
    }

    return getActionResponse({ data: data as any as TaskResult[] });
  } catch (error) {
    console.error("Error in listTasksAction:", error);
    return getActionResponse({ error });
  }
};

export const getTaskAction = async (
  taskSlug: string,
): Promise<ActionResponse<TaskResult>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase.rpc("get_task_data", {
      task_slug: taskSlug,
    });

    if (error) {
      console.error("Error fetching task:", error);
      throw error;
    }

    if (!data) {
      console.error("No data returned for task slug:", taskSlug);
      throw new Error("Task not found");
    }

    console.log("Task data:", data);

    // The RPC function returns data exactly matching TaskResult shape
    return getActionResponse({ data: data as any as TaskResult });
  } catch (error) {
    console.error("Error in getTaskAction:", error);
    return getActionResponse({ error });
  }
};
export const createTaskAction = async (
  task: TablesInsert<"tasks">,
): Promise<ActionResponse<TaskResult>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: projectAccess, error: accessError } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", task.project_id)
      .single();

    if (accessError || !projectAccess) throw new Error("Project access denied");

    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select(
        `
        *,
        project:projects (*),
        subtasks (*),
        task_schedule (*),
        comments (
          *,
          user:profiles!inner(*)
        ),
        assignee_profile:profiles (*)
      `,
      )
      .single();

    if (error) throw error;

    const taskResult: TaskResult = {
      task: data,
      assignee_profile: data.assignee_profile?.[0] ?? null,
      comments:
        data.comments?.map(comment => ({
          ...comment,
          user: Array.isArray(comment.user) ? comment.user[0] : comment.user,
        })) ?? [],
      subtasks: data.subtasks ?? [],
      task_schedule: data.task_schedule,
      project: data.project,
    };

    return getActionResponse({ data: taskResult });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const updateTaskAction = async (
  taskSlug: string,
  updates: TablesUpdate<"tasks">,
): Promise<ActionResponse<TaskResult>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("slug", taskSlug)
      .select(
        `
        *,
        project:projects (*),
        subtasks (*),
        task_schedule (*),
        comments (
          *,
          user:profiles!inner(*)
        ),
        assignee_profile:profiles (*)
      `,
      )
      .single();

    if (error) throw error;

    const taskResult: TaskResult = {
      task: data,
      assignee_profile: data.assignee_profile?.[0] ?? null,
      comments:
        data.comments?.map(comment => ({
          ...comment,
          user: Array.isArray(comment.user) ? comment.user[0] : comment.user,
        })) ?? [],
      subtasks: data.subtasks ?? [],
      task_schedule: data.task_schedule,
      project: data.project,
    };

    return getActionResponse({ data: taskResult });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const deleteTaskAction = async (
  taskSlug: string,
): Promise<ActionResponse<null>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("slug", taskSlug);

    if (error) throw error;

    return getActionResponse({ data: null });
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
    const { data: existingTasks, error: fetchError } = await supabase
      .from("tasks")
      .select("id, prefix, slug, title")
      .in("id", taskIds);

    if (fetchError) throw fetchError;

    if (!existingTasks) throw new Error("Could not fetch existing tasks");

    const updates = taskIds.map((id, index) => {
      const existingTask = existingTasks.find(task => task.id === id);
      if (!existingTask) {
        throw new Error(`Task with id ${id} not found`);
      }

      return {
        id,
        ordinal_id: index + 1,
        project_id: projectId,
        prefix: existingTask.prefix,
        slug: existingTask.slug,
        title: existingTask.title,
      };
    });

    const { error } = await supabase.from("tasks").upsert(updates);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};
