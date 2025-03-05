"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { MilestoneWithTasks } from "@/types/app.types";

export const getProjectMilestonesAction = async (
  projectSlug: string,
): Promise<ActionResponse<MilestoneWithTasks[]>> => {
  const actionName = "getProjectMilestonesAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    const { data, error } = await supabase.rpc("list_project_milestones", {
      project_slug: projectSlug,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;
    return getActionResponse({ data: data as any as MilestoneWithTasks[] });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const setProjectCurrentMilestoneAction = async (
  projectId: string,
  milestoneId: string | null,
): Promise<ActionResponse<boolean>> => {
  const actionName = "setProjectCurrentMilestoneAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    if (!milestoneId) {
      // If milestoneId is null, directly update the project
      const { error } = await supabase
        .from("projects")
        .update({ current_milestone_id: null })
        .eq("id", projectId);

      if (error) throw error;
      return getActionResponse({ data: true });
    }

    // If milestoneId is provided, use the RPC function
    const { data, error } = await supabase.rpc(
      "set_project_current_milestone",
      {
        p_project_id: projectId,
        p_milestone_id: milestoneId,
      },
    );

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;
    if (!data)
      throw new Error("You don't have permission to update this project");

    return getActionResponse({ data: true });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
