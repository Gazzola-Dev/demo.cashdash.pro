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
    const { data: rawData, error } = await supabase.rpc("list_project_tasks", {
      project_slug: filters.projectSlug,
    });

    if (error) {
      throw error;
    }

    if (!rawData) {
      throw new Error("Tasks not found");
    }

    let filteredData = rawData as unknown as TaskResult[];

    if (filters.status) {
      filteredData = filteredData.filter(
        task => task.task.status === filters.status,
      );
    }

    if (filters.priority) {
      filteredData = filteredData.filter(
        task => task.task.priority === filters.priority,
      );
    }

    if (filters.assignee) {
      filteredData = filteredData.filter(
        task => task.task.assignee === filters.assignee,
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredData = filteredData.filter(
        task =>
          task.task.title.toLowerCase().includes(searchLower) ||
          (task.task.description &&
            JSON.stringify(task.task.description)
              .toLowerCase()
              .includes(searchLower)),
      );
    }

    if (filters.sort) {
      filteredData.sort((a, b) => {
        const aValue = a.task[filters.sort!];
        const bValue = b.task[filters.sort!];
        const multiplier = filters.order === "asc" ? 1 : -1;

        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return 1 * multiplier;
        if (bValue === null) return -1 * multiplier;

        if (aValue < bValue) return -1 * multiplier;
        if (aValue > bValue) return 1 * multiplier;
        return 0;
      });
    } else {
      filteredData.sort(
        (a, b) =>
          new Date(b.task.created_at).getTime() -
          new Date(a.task.created_at).getTime(),
      );
    }

    return getActionResponse({ data: filteredData });
  } catch (error) {
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
      throw error;
    }

    if (!data) {
      throw new Error("Task not found");
    }

    return getActionResponse({ data: data as any as TaskResult });
  } catch (error) {
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
    const { data, error } = await supabase.rpc("update_task_data", {
      task_slug: taskSlug,
      task_updates: updates,
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Task update failed");
    }

    return getActionResponse({ data: data as any as TaskResult });
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
