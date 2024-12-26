// tag.actions.ts
"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { TablesInsert, TablesUpdate } from "@/types/database.types";

// Create tag action
export const createTagAction = async (tag: TablesInsert<"tags">) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("tags")
      .insert(tag)
      .select()
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Update tag action
export const updateTagAction = async (
  tagId: string,
  updates: TablesUpdate<"tags">,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("tags")
      .update(updates)
      .eq("id", tagId)
      .select()
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Delete tag action
export const deleteTagAction = async (tagId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { error } = await supabase.from("tags").delete().eq("id", tagId);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// List tags action
export const listTagsAction = async () => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase.from("tags").select().order("name");

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Assign tag to task action
export const assignTagAction = async (taskId: string, tagId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("task_tags")
      .insert({
        task_id: taskId,
        tag_id: tagId,
      })
      .select()
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Remove tag from task action
export const removeTagAction = async (taskId: string, tagId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { error } = await supabase
      .from("task_tags")
      .delete()
      .eq("task_id", taskId)
      .eq("tag_id", tagId);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};
