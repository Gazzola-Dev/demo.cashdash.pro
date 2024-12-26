// profile.actions.ts
"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { TablesUpdate } from "@/types/database.types";

// Get profile action
export const getProfileAction = async (userId?: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    // If no userId provided, get current user's profile
    if (!userId) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");
      userId = userData.user.id;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select()
      .eq("id", userId)
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Update profile action
export const updateProfileAction = async (
  updates: TablesUpdate<"profiles">,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    // Validate GitHub username uniqueness if provided
    if (updates.github_username) {
      const { data: existing } = await supabase
        .from("profiles")
        .select()
        .eq("github_username", updates.github_username)
        .neq("id", userData.user.id)
        .single();

      if (existing) {
        throw new Error("GitHub username already taken");
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userData.user.id)
      .select()
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Upload avatar action
export const uploadAvatarAction = async (file: File) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const fileExt = file.name.split(".").pop();
    const fileName = `${userData.user.id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // Update profile with new avatar URL
    const { data, error } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userData.user.id)
      .select()
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};

// Update preferences action
export const updatePreferencesAction = async (
  type: "notification" | "ui",
  preferences: Record<string, any>,
) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const updates =
      type === "notification"
        ? { notification_preferences: preferences }
        : { ui_preferences: preferences };

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userData.user.id)
      .select()
      .single();

    if (error) throw error;

    return getActionResponse({ data });
  } catch (error) {
    return getActionResponse({ error });
  }
};
