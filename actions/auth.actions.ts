"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
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
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (!data.user) throw new Error("No user returned from sign in");

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) throw profileError;

    const userWithProfile: UserWithProfile = {
      ...data.user,
      profile,
    };

    return getActionResponse({ data: userWithProfile });
  } catch (error) {
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
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) throw error;

    if (!data.user) throw new Error("No user returned from sign up");

    // Profile creation is handled by database trigger
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) throw profileError;

    const userWithProfile: UserWithProfile = {
      ...data.user,
      profile,
    };

    return getActionResponse({ data: userWithProfile });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const forgotPasswordAction = async (
  email: string,
): Promise<ActionResponse<null>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/${AuthFormType.ResetPassword}`,
    });

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const resetPasswordAction = async (
  password: string,
): Promise<ActionResponse<null>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const verifyEmailAction = async (
  token: string,
): Promise<ActionResponse<null>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "email",
    });

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};
