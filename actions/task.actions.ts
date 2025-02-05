"use server";
import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { Json, TablesInsert } from "@/types/database.types";
import {
  SubtaskInput,
  SubtaskResponse,
  TaskFilters,
  TaskResult,
  TaskUpdateWithSubtasks,
} from "@/types/task.types";

export const listTasksAction = async (
  filters?: TaskFilters,
): Promise<ActionResponse<TaskResult[]>> => {
  const actionName = "listTasksAction";
  const supabase = await getSupabaseServerActionClient();
  if (!filters?.projectSlug)
    return getActionResponse({ error: "No project slug provided" });
  try {
    const { data: rawData, error } = await supabase.rpc("list_project_tasks", {
      project_slug: filters.projectSlug,
    });

    conditionalLog(actionName, { data: rawData, error });

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
            task.task.description.toLowerCase().includes(searchLower)),
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
    conditionalLog(actionName, { error });
    return getActionResponse({ error });
  }
};

export const getTaskAction = async (
  taskSlug: string,
): Promise<ActionResponse<TaskResult>> => {
  const actionName = "getTaskAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase.rpc("get_task_data", {
      task_slug: taskSlug,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Task not found");
    }

    return getActionResponse({ data: data as any as TaskResult });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const createTaskAction = async (
  task: TablesInsert<"tasks">,
): Promise<ActionResponse<TaskResult>> => {
  const actionName = "createTaskAction";
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

    conditionalLog(actionName, { data, error });

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
    conditionalLog(actionName, { error });
    return getActionResponse({ error });
  }
};

export const updateTaskAction = async (
  taskSlug: string,
  updates: TaskUpdateWithSubtasks,
): Promise<ActionResponse<TaskResult>> => {
  const actionName = "updateTaskAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    // Convert the strongly-typed updates to a plain JSON object
    const jsonUpdates: { [key: string]: Json } = {
      ...updates,
      // Ensure nested objects are also converted to plain JSON
      subtasks: updates.subtasks
        ? JSON.parse(JSON.stringify(updates.subtasks))
        : undefined,
      task_schedule: updates.task_schedule
        ? JSON.parse(JSON.stringify(updates.task_schedule))
        : undefined,
    };

    const { data, error } = await supabase.rpc("update_task_data", {
      task_slug: taskSlug,
      task_updates: jsonUpdates,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Task update failed");
    }

    return getActionResponse({ data: data as any as TaskResult });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const deleteTaskAction = async (
  taskSlug: string,
): Promise<ActionResponse<null>> => {
  const actionName = "deleteTaskAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("slug", taskSlug);

    conditionalLog(actionName, { error });

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    conditionalLog(actionName, { error });
    return getActionResponse({ error });
  }
};

export const reorderTasksAction = async (
  projectId: string,
  taskIds: string[],
): Promise<ActionResponse<null>> => {
  const actionName = "reorderTasksAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: existingTasks, error: fetchError } = await supabase
      .from("tasks")
      .select("id, prefix, slug, title")
      .in("id", taskIds);

    conditionalLog(actionName, { data: existingTasks, error: fetchError });

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

    conditionalLog(actionName, { error });

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    conditionalLog(actionName, { error });
    return getActionResponse({ error });
  }
};

export const createSubtaskAction = async (
  subtask: SubtaskInput,
): Promise<SubtaskResponse> => {
  const actionName = "createSubtaskAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    // Get the current highest ordinal_id for the task
    const { data: currentSubtasks, error: subtasksError } = await supabase
      .from("subtasks")
      .select("ordinal_id")
      .eq("task_id", subtask.task_id)
      .order("ordinal_id", { ascending: false })
      .limit(1);
    conditionalLog(
      actionName + "1",
      { currentSubtasks, subtasksError },
      true,
      null,
    );
    if (subtasksError) throw subtasksError;

    // Calculate new ordinal_id
    const nextOrdinalId = currentSubtasks?.length
      ? currentSubtasks[0].ordinal_id + 1
      : 1;

    const { data, error } = await supabase
      .from("subtasks")
      .insert({
        ...subtask,
        ordinal_id: nextOrdinalId,
        status: subtask.status || "todo",
      })
      .select("*")
      .single();

    conditionalLog(actionName + "2", { data, error }, true);

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const deleteSubtaskAction = async (
  subtaskId: string,
): Promise<ActionResponse<null>> => {
  const actionName = "deleteSubtaskAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { error } = await supabase
      .from("subtasks")
      .delete()
      .eq("id", subtaskId);

    conditionalLog(actionName, { error });
    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    conditionalLog(actionName, { error });
    return getActionResponse({ error });
  }
};

export const upsertDraftTaskAction = async (
  projectSlug: string,
): Promise<ActionResponse<TaskResult>> => {
  const actionName = "upsertDraftTaskAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase.rpc("upsert_draft_task", {
      p_project_slug: projectSlug,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;
    if (!data) throw new Error("No data returned from upsert_draft_task");

    return getActionResponse({ data: data as any as TaskResult });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
