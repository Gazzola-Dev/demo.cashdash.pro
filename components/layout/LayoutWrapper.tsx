"use client";
import useSupabase from "@/hooks/useSupabase";
import { useLayoutSync } from "@/stores/layout.store";
import { LayoutData } from "@/types/layout.types";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface LayoutWrapperProps {
  children: React.ReactNode;
  initialData: LayoutData;
}

export function LayoutWrapper({ children, initialData }: LayoutWrapperProps) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Sync React Query data with Zustand
  useLayoutSync(initialData);

  // Handle auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async event => {
      if (event === "SIGNED_OUT") {
        queryClient.setQueryData(["layout-data"], null);
        queryClient.setQueryData(["user"], null);
        router.push("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, queryClient, router]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!initialData?.currentProject?.id) return;

    const channels = [
      supabase
        .channel("project-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "projects",
            filter: `id=eq.${initialData.currentProject.id}`,
          },
          () => queryClient.invalidateQueries({ queryKey: ["layout-data"] }),
        )
        .subscribe(),

      supabase
        .channel("task-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tasks",
            filter: `project_id=eq.${initialData.currentProject.id}`,
          },
          () => queryClient.invalidateQueries({ queryKey: ["layout-data"] }),
        )
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }, [supabase, queryClient, initialData?.currentProject?.id]);

  return children;
}
