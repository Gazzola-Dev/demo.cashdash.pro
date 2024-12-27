// layout.actions.ts
"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import configuration from "@/configuration";
import getActionResponse from "@/lib/action.util";
import { LayoutData, LayoutProject, LayoutTask } from "@/types/layout.types";

export const getLayoutDataAction = async (): Promise<{
  data: LayoutData | null;
  error: string | null;
}> => {
  console.log("\n=== Starting getLayoutDataAction ===");
  const supabase = await getSupabaseServerActionClient();

  try {
    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      console.log("No user found or user error:", { user, userError });
      return getActionResponse({ data: null });
    }
    console.log("User found:", { userId: user.id, email: user.email });

    // Get project memberships with project details
    console.log("\nFetching project memberships and projects...");
    const { data: memberships, error: membershipError } = await supabase
      .from("project_members")
      .select(
        `
        role,
        projects (
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
      .order("projects(updated_at)", { ascending: false });

    if (membershipError) {
      console.error("Error fetching memberships:", membershipError);
      throw membershipError;
    }

    console.log("Memberships found:", {
      count: memberships?.length || 0,
      data: memberships,
    });

    // Get user profile with current project
    console.log("\nFetching user profile...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw profileError;
    }

    // Format projects data, filtering out any null projects
    const projects: LayoutProject[] =
      memberships
        ?.filter(pm => pm.projects !== null)
        .map(pm => ({
          id: pm.projects!.id,
          name: pm.projects!.name,
          slug: pm.projects!.slug,
          status: pm.projects!.status,
          prefix: pm.projects!.prefix,
          role: pm.role,
          isCurrent: pm.projects!.id === profile?.current_project_id,
        })) || [];

    // Get current project
    const currentProject = projects.find(p => p.isCurrent) || projects[0];

    // Get recent tasks
    console.log("\nFetching recent tasks...");
    const { data: recentTasks, error: tasksError } = await supabase
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

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      throw tasksError;
    }

    // Get high priority tasks
    console.log("\nFetching high priority tasks...");
    const { data: highPriorityTasks, error: priorityError } = await supabase
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

    if (priorityError) {
      console.error("Error fetching priority tasks:", priorityError);
      throw priorityError;
    }

    // Format tasks with URLs
    const formatTasks = (tasks: any[] | null): LayoutTask[] =>
      tasks
        ?.filter(task => task.project !== null)
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

    // Construct layout data
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
    console.error("Error in getLayoutDataAction:", error);
    return getActionResponse({ error });
  }
};

export const setCurrentProjectAction = async (projectId: string) => {
  console.log("\n=== Starting setCurrentProjectAction ===");
  console.log("Project ID:", projectId);

  const supabase = await getSupabaseServerActionClient();

  try {
    console.log("Getting user data...");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.log("No authenticated user found");
      throw new Error("Not authenticated");
    }
    console.log("User found:", userData.user.id);

    console.log("Updating current project...");
    const { error } = await supabase
      .from("profiles")
      .update({ current_project_id: projectId })
      .eq("id", userData.user.id);

    if (error) {
      console.error("Error updating current project:", error);
      throw error;
    }

    console.log("Current project updated successfully");
    return getActionResponse({ data: null });
  } catch (error) {
    console.error("Error in setCurrentProjectAction:", error);
    return getActionResponse({ error });
  }
};
