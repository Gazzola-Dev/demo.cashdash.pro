"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ProfileResponse, UpdateProfileInput } from "@/types/profile.types";

export const getProfileAction = async (): Promise<ProfileResponse> => {
  const actionName = "getProfileAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    conditionalLog(actionName, { user, userError }, true);
    if (userError || !user) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc("get_profile_data", {
      user_id: user.id,
    });

    conditionalLog(actionName, { data, error }, true);
    if (error) throw error;

    return getActionResponse({ data: data as any as ProfileResponse["data"] });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const updateProfileAction = async (
  updates: UpdateProfileInput,
): Promise<ProfileResponse> => {
  const actionName = "updateProfileAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    conditionalLog(actionName, { user, userError }, true);
    if (userError || !user) throw new Error("Not authenticated");

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    conditionalLog(actionName, { updateError }, true);
    if (updateError) throw updateError;

    // Get updated profile data
    return getProfileAction();
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
