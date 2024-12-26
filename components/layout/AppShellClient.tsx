"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import AuthLayout from "@/components/layout/AuthLayout";
import { useLayoutData } from "@/hooks/layout.hooks";
import useSupabase from "@/hooks/useSupabase";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

function AppShellClient({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData: any;
}) {
  const { data: layoutData } = useLayoutData(initialData);
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      queryClient.setQueryData(["user"], session?.user ?? null);
      if (event === "SIGNED_OUT" || event === "SIGNED_IN")
        queryClient.invalidateQueries({ queryKey: ["userRole"] });
    });
  }, [queryClient, supabase]);

  if (!layoutData) return <AuthLayout />;

  return <AppLayout layoutData={layoutData}>{children}</AppLayout>;
}

export default AppShellClient;
