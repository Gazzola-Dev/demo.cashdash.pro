// schedule.actions.ts
"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { TablesInsert } from "@/types/database.types";

// Create/Update schedule action
export const upsertScheduleAction = async (
  taskId: string,
  schedule: Omit<TablesInsert<"task_schedule">, "task_id">,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    // Check if schedule exists
    const { data: existing } = await supabase
      .from("task_schedule")
      .select()
      .eq("task_id", taskId)
      .maybeSingle();

    if (existing) {
      // Update existing schedule
      const { data, error } = await supabase
        .from("task_schedule")
        .update(schedule)
        .eq("task_id", taskId)
        .select()
        .single();

      if (error) throw error;
      return getActionResponse({ data });
    } else {
      // Create new schedule
      const { data, error } = await supabase
        .from("task_schedule")
        .insert({ ...schedule, task_id: taskId })
        .select()
        .single();

      if (error) throw error;
      return getActionResponse({ data });
    }
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Get schedule action
export const getScheduleAction = async (taskId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("task_schedule")
      .select()
      .eq("task_id", taskId)
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Delete schedule action
export const deleteScheduleAction = async (taskId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { error } = await supabase
      .from("task_schedule")
      .delete()
      .eq("task_id", taskId);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Update time tracking action
export const updateTimeTrackingAction = async (
  taskId: string,
  updates: {
    actual_hours?: number;
    completed_at?: string | null;
  },
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("task_schedule")
      .update(updates)
      .eq("task_id", taskId)
      .select()
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// List schedules action (for calendar view)
export const listSchedulesAction = async (
  projectId: string,
  startDate?: string,
  endDate?: string,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    let query = supabase
      .from("task_schedule")
      .select(
        `
        *,
        task:tasks (
          id,
          title,
          status,
          priority,
          project_id
        )
      `,
      )
      .eq("task.project_id", projectId);

    if (startDate) {
      query = query.gte("start_date", startDate);
    }
    if (endDate) {
      query = query.lte("due_date", endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};
