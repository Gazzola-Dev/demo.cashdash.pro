"use server";
import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { TaskWithAssignee } from "@/types/app.types";
import { Tables } from "@/types/database.types";

type Task = Tables<"tasks">;

/**
 * Updates a task and its related data with proper RLS enforcement
 *
 * The following security rules are enforced by the database function:
 * - Global admins can perform any update on any task
 * - Project managers can make any update to tasks in draft milestones
 * - Project managers can update status, assignee, or priority of tasks in active milestones
 * - Task assignees can update only the status of tasks assigned to them
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

    // Use the database function to update the task with RLS enforcement
    const { data, error } = await supabase.rpc("update_task_data", {
      task_id: taskId,
      task_updates: updates,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) {
      throw error;
    }

    // The RPC function returns JSON data
    return getActionResponse({ data: data as Task });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error: error as Error });
  }
};

/**
 * Updates the ordinal priority of multiple tasks to change their order
 *
 * Security rules enforced by the database function:
 * - Only global admins and project managers can reorder tasks
 * - For active milestones, additional verification ensures appropriate permissions
 *
 * @param taskIds - Array of task IDs to update
 * @param priorities - Array of corresponding ordinal priority values
 * @returns ActionResponse indicating success or error
 */
export const updateTasksOrderAction = async (
  taskIds: string[],
  priorities: number[],
): Promise<ActionResponse<boolean>> => {
  const actionName = "updateTasksOrderAction";
  try {
    const supabase = await getSupabaseServerActionClient();

    // Use the database function to update task priorities with RLS enforcement
    const { data, error } = await supabase.rpc("update_tasks_order", {
      p_task_ids: taskIds,
      p_priorities: priorities,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) {
      throw error;
    }

    return getActionResponse({ data: true });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

/**
 * Creates a new task with RLS enforcement
 *
 * Security rules enforced by the database function:
 * - Only global admins and project managers can create tasks
 * - Project managers can only associate tasks with draft milestones
 *
 * @param projectId - The ID of the project to create the task in
 * @param milestoneId - Optional ID of the milestone to associate with the task
 * @returns ActionResponse containing the created task data or error
 */
export const createTaskAction = async (
  projectId: string,
  milestoneId?: string | null,
): Promise<ActionResponse<TaskWithAssignee>> => {
  const actionName = "createTaskAction";
  try {
    const supabase = await getSupabaseServerActionClient();

    // Call the create_task database function with the project and milestone IDs
    const { data, error } = await supabase.rpc("create_task", {
      p_project_id: projectId,
      p_milestone_id: milestoneId || undefined,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;

    // Cast the response to the required type for the app state
    const taskWithAssignee: TaskWithAssignee = {
      ...(data as Task),
      assignee_profile: null, // Add the required properties for TaskWithAssignee
    };

    return getActionResponse({ data: taskWithAssignee });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

/**
 * Deletes a task and its related data with proper RLS enforcement
 *
 * The following security rules are enforced by the database function:
 * - Global admins can delete any task
 * - Project managers can delete tasks in draft milestones or tasks not in milestones
 * - Task assignees can delete their own tasks if not in active milestones
 *
 * @param taskId - The ID of the task to delete
 * @returns ActionResponse indicating success or error
 */
export const deleteTaskAction = async (
  taskId: string,
): Promise<ActionResponse<boolean>> => {
  const actionName = "deleteTaskAction";
  try {
    const supabase = await getSupabaseServerActionClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (!userData?.user || userError) throw new Error("Not authenticated");

    // Use the database function to delete the task with RLS enforcement
    const { data, error } = await supabase.rpc("delete_task", {
      p_task_id: taskId,
      p_user_id: userData?.user?.id,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) {
      throw error;
    }

    return getActionResponse({ data: true });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error: error as Error });
  }
};
