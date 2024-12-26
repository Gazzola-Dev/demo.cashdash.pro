// subtask.actions.ts
"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { TablesInsert, TablesUpdate } from "@/types/database.types";

// Create subtask action
export const createSubtaskAction = async (
  subtask: TablesInsert<"subtasks">,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    // Insert subtask - ordinal_id is handled by trigger
    const { data, error } = await supabase
      .from("subtasks")
      .insert(subtask)
      .select()
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Update subtask action
export const updateSubtaskAction = async (
  subtaskId: string,
  updates: TablesUpdate<"subtasks">,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("subtasks")
      .update(updates)
      .eq("id", subtaskId)
      .select()
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Delete subtask action
export const deleteSubtaskAction = async (subtaskId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { error } = await supabase
      .from("subtasks")
      .delete()
      .eq("id", subtaskId);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// List subtasks action
export const listSubtasksAction = async (
  taskId: string,
  filters?: {
    status?: string;
    sort?: string;
    order?: "asc" | "desc";
  },
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    let query = supabase.from("subtasks").select().eq("task_id", taskId);

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.sort) {
      query = query.order(filters.sort, { ascending: filters.order === "asc" });
    } else {
      query = query.order("ordinal_id", { ascending: true });
    }

    const { data, error } = await query;

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// subtask.actions.ts

export const reorderSubtasksAction = async (
  taskId: string,
  subtaskIds: string[],
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    // Update each subtask's ordinal_id based on new order
    const updates = subtaskIds.map((id, index) => ({
      id,
      ordinal_id: index + 1,
      // Add required fields with their current values
      task_id: taskId,
      title: "", // Will be preserved by upsert
    }));

    const { error } = await supabase
      .from("subtasks")
      .upsert(updates, { onConflict: "id" });

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};
