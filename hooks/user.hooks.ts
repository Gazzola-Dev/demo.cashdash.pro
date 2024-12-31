"use client";
import useSupabase from "@/hooks/useSupabase";
import { useToastQueue } from "@/hooks/useToastQueue";
import { Tables } from "@/types/database.types";
import { HookOptions } from "@/types/db.types";
import { User } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

enum SuccessMessages {
  SIGN_IN_SUCCESS = "Sign in link sent! Check your email :)",
  UPDATE_USER_SUCCESS = "User updated successfully",
  DELETE_USER_SUCCESS = "User deleted successfully",
  SIGN_OUT_SUCCESS = "Sign out successful",
}

export const useGetUser = ({ initialData }: HookOptions<User> = {}) => {
  const supabase = useSupabase();

  return useQuery<User | null, Error>({
    queryKey: ["user"],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
    staleTime: 1000 * 60 * 5,
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
}: HookOptions<User> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();
  const supabase = useSupabase();

  return useMutation<{ user: User | null; session: unknown }, Error, string>({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: successMessage || SuccessMessages.SIGN_IN_SUCCESS,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to sign in",
        open: true,
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
