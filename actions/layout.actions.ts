// layout.actions.ts
"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import configuration from "@/configuration";
import getActionResponse from "@/lib/action.util";
import { Code2 } from "lucide-react";

export const getLayoutDataAction = async () => {
  const supabase = await getSupabaseServerActionClient();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // Return null data if not authenticated (without throwing error)
    if (!user || userError) {
      return getActionResponse({ data: null });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select()
      .eq("id", user.id)
      .single();

    // Get project memberships
    const { data: projectMemberships } = await supabase
      .from("project_members")
      .select(
        `
        role,
        project:projects (
          id,
          name,
          slug,
          status
        )
      `,
      )
      .eq("user_id", user.id);

    // Get recent tasks
    const { data: recentTasks } = await supabase
      .from("tasks")
      .select(
        `
        id,
        title,
        status,
        priority,
        project:projects (
          slug
        )
      `,
      )
      .in("project_id", projectMemberships?.map(pm => pm?.project?.id) || [])
      .order("updated_at", { ascending: false })
      .limit(5);

    const layoutData = {
      teams:
        projectMemberships?.map(pm => ({
          name: pm.project?.name,
          slug: pm.project?.slug,
          logo: Code2,
          plan: pm.role,
        })) || [],
      user: {
        name: profile?.display_name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        avatar: profile?.avatar_url || "",
      },
      recentTasks:
        recentTasks?.map(task => ({
          title: task.title,
          url: configuration.paths.tasks.view({
            project_slug: task.project?.slug,
            task_slug: task.id,
          }),
        })) || [],
      navSecondary: [
        {
          title: "Settings",
          url: configuration.paths.settings.all,
          icon: "Settings2",
        },
        {
          title: "Support",
          url: configuration.paths.support,
          icon: "LifeBuoy",
        },
        {
          title: "Feedback",
          url: configuration.paths.feedback,
          icon: "Send",
        },
      ],
    };

    return getActionResponse({ data: layoutData });
  } catch (error) {
    return getActionResponse({ error });
  }
};
