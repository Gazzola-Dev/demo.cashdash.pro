"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { AppState, MilestoneWithTasks, TaskComplete } from "@/types/app.types";
import { Tables } from "@/types/database.types";

type Profile = Tables<"profiles">;
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

    // Call the get_app_data function with auth context
    const { data: untypedData, error } = await supabase.rpc("get_app_data");
    const data = untypedData as any as AppStateWithoutTask | null;
    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;

    // Fetch user roles (app_role)
    const { data: userRolesData, error: userRolesError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    conditionalLog(actionName, { userRolesData, userRolesError }, true);

    if (userRolesError) throw userRolesError;

    const appRole = userRolesData?.role || null;

    // Fetch project member role if there's a current project
    let projectMemberRole = null;
    if (data?.project?.id) {
      const { data: memberData, error: memberError } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", data.project.id)
        .eq("user_id", user.id)
        .maybeSingle();

      conditionalLog(actionName, { memberData, memberError }, true);

      if (!memberError && memberData) {
        projectMemberRole = memberData.role;
      }
    }

    // Fetch project subscription if there's a current project
    let subscription = null;
    if (data?.project?.id) {
      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("project_subscriptions")
          .select("*")
          .eq("project_id", data.project.id)
          .maybeSingle();

      conditionalLog(actionName, { subscriptionData, subscriptionError }, true);

      if (!subscriptionError && subscriptionData) {
        subscription = subscriptionData;
      }
    }

    // Fetch current milestone if there's a current project
    let currentMilestone = null;
    if (data?.project?.id && data?.project?.current_milestone_id) {
      // First get the basic milestone data
      const { data: milestoneData, error: milestoneError } = await supabase
        .from("milestones")
        .select("*")
        .eq("id", data.project.current_milestone_id)
        .maybeSingle();

      conditionalLog(actionName, { milestoneData, milestoneError }, true);

      if (!milestoneError && milestoneData) {
        // Now get task counts for this milestone
        const { data: taskData, error: taskCountError } = await supabase
          .from("milestone_tasks")
          .select("*, tasks!inner(*)")
          .eq("milestone_id", milestoneData.id);

        conditionalLog(actionName, { taskData, taskCountError }, true);

        if (!taskCountError) {
          const tasksTotal = taskData.length;
          const tasksCompleted = taskData.filter(
            item => item.tasks.status === "completed",
          ).length;

          currentMilestone = {
            ...milestoneData,
            tasks: taskData.map(item => ({
              id: item.tasks.id,
              title: item.tasks.title,
            })),
            tasks_count: tasksTotal,
            tasks_completed: tasksCompleted,
            is_current: true,
          } as MilestoneWithTasks;
        } else {
          // Even if we can't get task counts, at least include the milestone data
          currentMilestone = {
            ...milestoneData,
            tasks: [],
            tasks_count: 0,
            tasks_completed: 0,
            is_current: true,
          } as MilestoneWithTasks;
        }
      }
    }

    // Add the new data to the response
    const enrichedData = {
      ...data,
      appRole,
      projectMemberRole,
      subscription,
      currentMilestone,
      project: data?.project || data?.projects?.[0],
    };

    return getActionResponse({
      data: enrichedData as any as AppStateWithoutTask,
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

    conditionalLog(actionName, { data, error }, true), null;

    if (error) throw error;
    return getActionResponse({ data: data as Profile });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
