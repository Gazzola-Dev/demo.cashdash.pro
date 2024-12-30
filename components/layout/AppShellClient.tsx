"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import AuthLayout from "@/components/layout/AuthLayout";
import configuration from "@/configuration";
import { useLayoutData } from "@/hooks/layout.hooks";
import useSupabase from "@/hooks/useSupabase";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

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
  const pathname = usePathname();

  const handleAuthChange = useCallback(
    async (event: string) => {
      if (event === "SIGNED_OUT") {
        queryClient.setQueryData(["layout-data"], null);
        queryClient.setQueryData(["user"], null);
        queryClient.invalidateQueries({ queryKey: ["userRole"] });
      } else if (event === "SIGNED_IN") {
        queryClient.invalidateQueries({ queryKey: ["userRole"] });
      }
    },
    [queryClient],
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => handleAuthChange(event));
    return () => subscription.unsubscribe();
  }, [supabase, handleAuthChange]);

  useEffect(() => {
    if (!layoutData) return;

    if (!layoutData.projects || layoutData.projects.length === 0) {
      router.push(configuration.paths.project.new);
    } else if (
      pathname === configuration.paths.appHome &&
      layoutData.currentProject
    ) {
      // Redirect from home to current project overview
      router.push(
        configuration.paths.project.overview({
          project_slug: layoutData.currentProject.slug,
        }),
      );
    }
  }, [layoutData, router, pathname]);

  if (!layoutData) return <AuthLayout />;

  return <AppLayout layoutData={layoutData}>{children}</AppLayout>;
}

export default AppShellClient;
