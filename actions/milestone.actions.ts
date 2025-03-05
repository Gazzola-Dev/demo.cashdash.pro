"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { MilestoneWithTasks } from "@/types/app.types";
import { Tables } from "@/types/database.types";

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

    conditionalLog(actionName, { data, error }, true, null);

    if (error) throw error;
    if (!data)
      throw new Error("You don't have permission to update this project");

    return getActionResponse({ data: true });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

type Milestone = Tables<"milestones">;

// In actions/milestone.actions.ts
export const createMilestoneAction = async (
  projectId: string,
): Promise<ActionResponse<MilestoneWithTasks>> => {
  const actionName = "createMilestoneAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    // Create a new blank milestone
    const { data: milestoneData, error: milestoneError } = await supabase
      .from("milestones")
      .insert([
        {
          project_id: projectId,
          title: "New Milestone",
          status: "draft",
          payment_cents: 0,
          payment_status: "pending",
        },
      ])
      .select()
      .single();

    conditionalLog(actionName, { milestoneData, milestoneError }, true);

    if (milestoneError) throw milestoneError;

    // Set this as the current milestone
    const { error: updateError } = await supabase
      .from("projects")
      .update({ current_milestone_id: milestoneData.id })
      .eq("id", projectId);

    conditionalLog(actionName, { updateError }, true);

    if (updateError) throw updateError;

    // Return the milestone with an empty tasks array to match the expected type
    const result: MilestoneWithTasks = {
      ...milestoneData,
      tasks: [],
      tasks_count: 0,
      tasks_completed: 0,
      is_current: true,
    };

    return getActionResponse({ data: result });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
