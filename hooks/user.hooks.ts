"use client";
import { inviteMemberAction } from "@/actions/profile.actions";
import useSupabase from "@/hooks/useSupabase";
import { useToastQueue } from "@/hooks/useToastQueue";
import { conditionalLog } from "@/lib/log.utils";
import { Tables, TablesInsert } from "@/types/database.types";
import { HookOptions } from "@/types/db.types";
import { ProjectWithDetails } from "@/types/project.types";
import { UserWithProfile } from "@/types/user.types";
import { User } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

enum SuccessMessages {
  SIGN_IN_SUCCESS = "Sign in link sent! Check your email :)",
  UPDATE_USER_SUCCESS = "User updated successfully",
  DELETE_USER_SUCCESS = "User deleted successfully",
  SIGN_OUT_SUCCESS = "Sign out successful",
}

export const useInviteMember = ({
  errorMessage,
  successMessage,
}: HookOptions<ProjectWithDetails> = {}) => {
  const hookName = "useInviteMember";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (invitation: TablesInsert<"project_invitations">) => {
      const { data, error } = await inviteMemberAction(invitation);
      conditionalLog(hookName, { data, error }, false);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: data => {
      conditionalLog(hookName, { success: data }, false);
      // Invalidate both project and profile queries since a new profile might have been created
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: successMessage || "Invitation sent successfully",
      });
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false);
      toast({
        title: errorMessage || error.message,
        description: "Failed to send invitation",
        variant: "destructive",
      });
    },
  });
};

export const useGetUser = ({
  initialData,
}: { initialData?: UserWithProfile } = {}) => {
  const supabase = useSupabase();
  const hookName = "useGetUser";

  return useQuery<UserWithProfile | null, Error>({
    queryKey: ["user"],
    queryFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      conditionalLog(hookName, { user, userError }, false);
      if (userError) throw userError;
      if (!user) return null;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      conditionalLog(hookName, { profile, profileError }, false);
      if (profileError) throw profileError;

      return {
        ...user,
        profile,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialData,
  });
};

export const useUpdateUser = ({
  errorMessage,
  successMessage,
}: HookOptions<User> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();
  const supabase = useSupabase();

  return useMutation<
    User | null,
    Error,
    {
      email?: string;
      password?: string;
      first_name?: string;
      last_name?: string;
    }
  >({
    mutationFn: async user => {
      const {
        data: { user: updatedUser },
        error,
      } = await supabase.auth.updateUser({
        email: user.email,
        password: user.password,
        data: { first_name: user.first_name, last_name: user.last_name },
      });
      if (error) throw error;
      return updatedUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: successMessage || SuccessMessages.UPDATE_USER_SUCCESS,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to update user",
        open: true,
      });
    },
  });
};

export const useDeleteUser = ({
  errorMessage,
  successMessage,
}: HookOptions<User> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();
  const supabase = useSupabase();

  return useMutation<string, Error, string>({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      return `User ${userId} deleted successfully`;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: successMessage || SuccessMessages.DELETE_USER_SUCCESS,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to delete user",
        open: true,
      });
    },
  });
};

export const useSignInWithMagicLink = ({
  errorMessage,
  successMessage,
}: {
  errorMessage?: string;
  successMessage?: string;
} = {}) => {
  const hookName = "useSignInWithMagicLink";
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();
  const supabase = useSupabase();

  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.signInWithOtp({ email });
      conditionalLog(hookName, { error }, false, null);
      if (error) throw new Error(error.message);
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: successMessage || "Sign in link sent! Check your email :)",
      });
    },
    onError: (error: Error) => {
      conditionalLog(hookName, { error }, false);
      toast({
        title: errorMessage || error.message,
        description: "Failed to send sign in link",
        variant: "destructive",
      });
    },
  });
};

export const useSignOut = ({
  errorMessage,
  successMessage,
}: HookOptions<User> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();
  const supabase = useSupabase();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: successMessage || SuccessMessages.SIGN_OUT_SUCCESS,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to sign out",
        open: true,
      });
    },
  });
};

export const useGetUserRole = ({
  initialData,
}: HookOptions<Tables<"user_roles">> = {}) => {
  const supabase = useSupabase();

  return useQuery<Tables<"user_roles"> | null, Error>({
    queryKey: ["userRole"],
    queryFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
    initialData,
  });
};

export const useIsAdmin = () => {
  const { data } = useGetUserRole();
  return data?.role === "admin" || false;
};
