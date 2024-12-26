// layout.actions.ts
"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import configuration from "@/configuration";
import getActionResponse from "@/lib/action.util";
import { LayoutData } from "@/types/layout.types";

export const getLayoutDataAction = async (): Promise<{
  data: LayoutData | null;
  error: string | null;
}> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    // Get current user with profile and current project
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      return getActionResponse({ data: null });
    }

    // Get user profile with current project
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        `
        *,
        current_project:projects (
          id,
          name,
          slug,
          status,
          prefix
        )
      `,
      )
      .eq("id", user.id)
      .single();

    // Get project memberships with project details
    const { data: projectMemberships } = await supabase
      .from("project_members")
      .select(
        `
        role,
        project:projects (
          id,
          name,
          slug,
          status,
          prefix,
          updated_at
        )
      `,
      )
      .eq("user_id", user.id)
      .order("project(updated_at)", { ascending: false });

    // Format projects data
    const projects =
      projectMemberships
        ?.filter(pm => pm.project) // Filter out null projects
        .map(pm => ({
          id: pm.project!.id,
          name: pm.project!.name,
          slug: pm.project!.slug,
          status: pm.project!.status,
          prefix: pm.project!.prefix,
          role: pm.role,
          isCurrent: pm.project!.id === profile?.current_project_id,
        })) || [];

    // Get current project - use stored current project or default to most recently updated
    const currentProject = projects.find(p => p.isCurrent) || projects[0];

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
          slug,
          name
        )
      `,
      )
      .in(
        "project_id",
        projects.map(p => p.id),
      )
      .order("updated_at", { ascending: false })
      .limit(5);

    // Get high priority tasks
    const { data: highPriorityTasks } = await supabase
      .from("tasks")
      .select(
        `
        id,
        title,
        status,
        priority,
        project:projects (
          slug,
          name
        )
      `,
      )
      .in(
        "project_id",
        projects.map(p => p.id),
      )
      .eq("priority", "high")
      .not("status", "eq", "completed")
      .order("created_at", { ascending: false })
      .limit(5);

    // Format tasks with URLs
    const formatTasks = (tasks: any[] | null) =>
      tasks
        ?.filter(task => task.project) // Filter out tasks with null projects
        .map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          url: configuration.paths.tasks.view({
            project_slug: task.project.slug,
            task_slug: task.id,
          }),
          project: {
            slug: task.project.slug,
            name: task.project.name,
          },
        })) || [];

    const layoutData: LayoutData = {
      user: {
        id: user.id,
        name: profile?.display_name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        avatar: profile?.avatar_url || "",
      },
      currentProject,
      projects,
      recentTasks: formatTasks(recentTasks),
      highPriorityTasks: formatTasks(highPriorityTasks),
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

// Action to update current project
export const setCurrentProjectAction = async (projectId: string) => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("profiles")
      .update({ current_project_id: projectId })
      .eq("id", userData.user.id);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};
