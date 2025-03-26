"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { TaskWithAssignee } from "@/types/app.types";
import { Tables } from "@/types/database.types";

type Task = Tables<"tasks">;

/**
 * Updates a task and its related data (subtasks, etc.)
 *
 * @param taskId - The ID of the task to update
 * @param updates - Object containing the fields to update
 * @returns ActionResponse containing the updated task data or error
 */
export const updateTaskAction = async (
  taskId: string,
  updates: Partial<Task>,
): Promise<ActionResponse<Task>> => {
  const actionName = "updateTaskAction";
  try {
    const supabase = await getSupabaseServerActionClient();

    // Use the database function to update the task
    const { data, error } = await supabase.rpc("update_task_data", {
      task_id: taskId,
      task_updates: updates,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) {
      throw error;
    }

    return getActionResponse({ data: data as Task });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error: error as Error });
  }
};

export const updateTasksOrderAction = async (
  taskIds: string[],
  priorities: number[],
): Promise<ActionResponse<boolean>> => {
  const actionName = "updateTasksOrderAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    // Create an array of updates to run in parallel
    const updates = taskIds.map((taskId, index) => {
      return supabase
        .from("tasks")
        .update({ ordinal_priority: priorities[index] })
        .eq("id", taskId);
    });

    // Execute all updates in parallel
    const results = await Promise.all(updates);

    // Check if any update had an error
    const hasError = results.some(result => result.error);

    if (hasError) {
      const errors = results
        .filter(result => result.error)
        .map(result => result.error);
      throw new Error(
        `Error updating task priorities: ${JSON.stringify(errors)}`,
      );
    }

    conditionalLog(actionName, { success: true }, true);
    return getActionResponse({ data: true });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const createTaskAction = async (
  projectId: string,
  milestoneId?: string | null,
): Promise<ActionResponse<TaskWithAssignee>> => {
  const actionName = "createTaskAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    // Call the new create_task database function with the project and milestone IDs
    const { data, error } = await supabase.rpc("create_task", {
      p_project_id: projectId,
      p_milestone_id: milestoneId || undefined,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;

    // Cast the response to the required type for the app state
    const taskWithAssignee: TaskWithAssignee = {
      // @ts-ignore: allow type casting
      ...data,
      assignee_profile: null, // Add the required properties for TaskWithAssignee
    };

    return getActionResponse({ data: taskWithAssignee });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
