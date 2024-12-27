"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import AuthLayout from "@/components/layout/AuthLayout";
import configuration from "@/configuration";
import { useLayoutData } from "@/hooks/layout.hooks";
import useSupabase from "@/hooks/useSupabase";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      queryClient.setQueryData(["user"], session?.user ?? null);
      if (event === "SIGNED_OUT" || event === "SIGNED_IN")
        queryClient.invalidateQueries({ queryKey: ["userRole"] });
    });
  }, [queryClient, supabase]);

  // If we have layoutData (user is authenticated) but no projects, redirect to new project page
  useEffect(() => {
    if (
      layoutData &&
      (!layoutData.projects || layoutData.projects.length === 0)
    ) {
      router.push(configuration.paths.project.new);
    }
  }, [layoutData, router]);

  if (!layoutData) return <AuthLayout />;

  return <AppLayout layoutData={layoutData}>{children}</AppLayout>;
}

export default AppShellClient;
