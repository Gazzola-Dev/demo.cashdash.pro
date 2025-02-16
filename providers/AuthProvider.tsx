import { useGetProfile } from "@/hooks/query.hooks";
import useSupabase from "@/hooks/useSupabase";
import { useGetUser } from "@/hooks/user.hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { refetch: refetchProfile } = useGetProfile();
  const { refetch: refetchUser } = useGetUser();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async event => {
      if (event === "SIGNED_OUT") {
        queryClient.setQueryData(["profile"], null);
        queryClient.setQueryData(["user"], null);
      } else if (event === "SIGNED_IN") {
        refetchProfile();
        refetchUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, queryClient, router, refetchProfile, refetchUser]);
  return children;
}

export default AuthProvider;
