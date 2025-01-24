"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { AuthFormType } from "@/types/auth.types";
import { UserResponse, UserWithProfile } from "@/types/user.types";

export const signInWithEmailAction = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<UserResponse> => {
  const actionName = "signInWithEmailAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;
    if (!data.user) throw new Error("No user returned from sign in");

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    conditionalLog(actionName, { profile, profileError }, true);
    if (profileError) throw profileError;

    const userWithProfile: UserWithProfile = {
      ...data.user,
      profile,
    };

    return getActionResponse({ data: userWithProfile });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const signUpWithEmailAction = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<UserResponse> => {
  const actionName = "signUpWithEmailAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;
    if (!data.user) throw new Error("No user returned from sign up");

    // Profile creation is handled by database trigger
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    conditionalLog(actionName, { profile, profileError }, true);
    if (profileError) throw profileError;

    const userWithProfile: UserWithProfile = {
      ...data.user,
      profile,
    };

    return getActionResponse({ data: userWithProfile });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const forgotPasswordAction = async (
  email: string,
): Promise<ActionResponse<null>> => {
  const actionName = "forgotPasswordAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/${AuthFormType.ResetPassword}`,
    });

    conditionalLog(actionName, { error }, true);
    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const resetPasswordAction = async (
  password: string,
): Promise<ActionResponse<null>> => {
  const actionName = "resetPasswordAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    conditionalLog(actionName, { error }, true);
    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const verifyEmailAction = async (
  token: string,
): Promise<ActionResponse<null>> => {
  const actionName = "verifyEmailAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "email",
    });

    conditionalLog(actionName, { error }, true);
    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
