"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { AppState, TaskComplete } from "@/types/app.types";
import { Tables } from "@/types/database.types";

type Profile = Tables<"profiles">;
type Project = Tables<"projects">;
type AppStateWithoutTask = Omit<AppState, "task">;

export const getAppDataAction = async (): Promise<
  ActionResponse<AppStateWithoutTask>
> => {
  const actionName = "getAppDataAction";

  const supabase = await getSupabaseServerActionClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) throw new Error("Not authenticated");

    // Call the enhanced get_app_data function with auth context
    // This single function now returns all the data needed for the app store
    const { data: appData, error } = await supabase.rpc("get_app_data");
    conditionalLog(actionName, { appData, error }, true);

    if (error) throw error;

    // Return the data directly as AppStateWithoutTask
    // The data structure from get_app_data matches what the app store expects
    return getActionResponse({
      data: appData as any as AppStateWithoutTask,
    });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const getTaskAction = async (
  taskIdentifier: string,
): Promise<ActionResponse<TaskComplete>> => {
  const actionName = "getTaskAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    // Call the get_task function with auth context
    const { data, error } = await supabase.rpc("get_task", {
      task_identifier: taskIdentifier,
    });
    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;
    return getActionResponse({ data: data as any as TaskComplete });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const updateProfileAction = async (
  userId: string,
  updates: Partial<Profile>,
): Promise<ActionResponse<Profile>> => {
  const actionName = "updateProfileAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    const { data, error } = await supabase.rpc("update_profile_data", {
      p_user_id: userId,
      p_updates: updates,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;
    return getActionResponse({ data: data as Profile });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const updateProjectAction = async (
  projectId: string,
  updates: Partial<Project>,
): Promise<ActionResponse<Project>> => {
  const actionName = "updateProjectAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc("update_project_data", {
      p_project_id: projectId,
      p_updates: updates,
      p_user_id: userData.user.id,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;
    return getActionResponse({ data: data as Project });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
