import useSupabase from "@/hooks/useSupabase";
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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async event => {
      if (event === "SIGNED_OUT") {
        // Clear profile and user data from cache
        queryClient.setQueryData(["profile"], null);
        queryClient.setQueryData(["user"], null);
        router.push("/auth");
      } else if (event === "SIGNED_IN") {
        // Clear stale data and let hooks refetch fresh data
        queryClient.setQueryData(["profile"], null);
        queryClient.setQueryData(["user"], null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, queryClient, router]);

  return children;
}

export default AuthProvider;
