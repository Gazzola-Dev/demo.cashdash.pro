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

// Updated createMilestoneAction to ensure milestone data is returned with is_current flag
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

    // Return the milestone with is_current flag set to true
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

// New action for updating milestone
export const updateMilestoneAction = async (
  milestoneId: string,
  updates: Partial<Milestone>,
): Promise<ActionResponse<Milestone>> => {
  const actionName = "updateMilestoneAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    const { data, error } = await supabase
      .from("milestones")
      .update(updates)
      .eq("id", milestoneId)
      .select()
      .single();

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;
    return getActionResponse({ data: data as Milestone });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

// In actions/milestone.actions.ts - Add this function
export const deleteMilestoneAction = async (
  milestoneId: string,
): Promise<ActionResponse<boolean>> => {
  const actionName = "deleteMilestoneAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    // First check if this milestone is currently set as current_milestone_id in any project
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("current_milestone_id", milestoneId)
      .maybeSingle();

    conditionalLog(actionName, { projectData, projectError }, true);

    if (projectError) throw projectError;

    // If this milestone is set as current in a project, remove that reference first
    if (projectData) {
      const { error: updateError } = await supabase
        .from("projects")
        .update({ current_milestone_id: null })
        .eq("id", projectData.id);

      if (updateError) throw updateError;
    }

    // Delete all milestone_tasks associations
    const { error: tasksError } = await supabase
      .from("milestone_tasks")
      .delete()
      .eq("milestone_id", milestoneId);

    if (tasksError) throw tasksError;

    // Delete the milestone
    const { error } = await supabase
      .from("milestones")
      .delete()
      .eq("id", milestoneId);

    conditionalLog(actionName, { error }, true);

    if (error) throw error;
    return getActionResponse({ data: true });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
