"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import configuration from "@/configuration";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import { LayoutData, LayoutTask } from "@/types/layout.types";
import { ProjectMember } from "@/types/project.types";
import { RequiredProject, TaskWithProject } from "@/types/task.types";

export const getLayoutDataAction = async (): Promise<
  ActionResponse<LayoutData>
> => {
  const actionName = "getLayoutDataAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    conditionalLog(actionName, { user, userError }, true);

    if (!user || userError) throw userError || new Error("Not authenticated");

    // Get project memberships with project details
    const { data: memberships, error: membershipError } = await supabase
      .from("project_members")
      .select(
        `
        id,
        project_id,
        user_id,
        role,
        created_at,
        projects (
          id,
          name,
          description,
          status,
          slug,
          prefix,
          github_repo_url,
          github_owner,
          github_repo,
          created_at,
          updated_at
        )
      `,
      )
      .eq("user_id", user.id)
      .order("projects(updated_at)", { ascending: false });

    conditionalLog(actionName, { memberships, membershipError }, true);

    if (membershipError) {
      throw membershipError;
    }

    // Get user profile with current project
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    conditionalLog(actionName, { profile, profileError }, true);

    if (profileError) {
      throw profileError;
    }

    // Format projects data
    const projects = memberships
      ?.filter((pm): pm is ProjectMember & { projects: RequiredProject } =>
        Boolean(pm.projects),
      )
      .map(pm => ({
        id: pm.projects.id,
        name: pm.projects.name,
        slug: pm.projects.slug,
        status: pm.projects.status,
        prefix: pm.projects.prefix,
        role: pm.role,
        isCurrent: pm.projects.id === profile?.current_project_id,
      }));

    // Get current project
    const currentProject = projects?.find(p => p.isCurrent) || projects?.[0];

    // Only proceed with task queries if there's a current project
    let recentTasks: TaskWithProject[] = [];
    let priorityTasks: TaskWithProject[] = [];

    if (currentProject) {
      // Get recent tasks
      const { data: recentTasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(
          `
          id,
          title,
          description,
          status,
          priority,
          ordinal_id,
          prefix,
          slug,
          created_at,
          updated_at,
          project:projects (
            id,
            name,
            description,
            status,
            slug,
            prefix,
            github_repo_url,
            github_owner,
            github_repo,
            created_at,
            updated_at
          )
        `,
        )
        .eq("project_id", currentProject.id)
        .order("updated_at", { ascending: false })
        .limit(5);

      conditionalLog(actionName, { recentTasksData, tasksError }, true);

      if (tasksError) {
        throw tasksError;
      }

      // Filter out tasks with null projects
      recentTasks = recentTasksData.filter((task): task is TaskWithProject =>
        Boolean(task.project),
      );

      // Get priority tasks ordered by urgency
      const { data: priorityTasksData, error: priorityError } = await supabase
        .from("tasks")
        .select(
          `
          id,
          title,
          description,
          status,
          priority,
          ordinal_id,
          prefix,
          slug,
          created_at,
          updated_at,
          project:projects (
            id,
            name,
            description,
            status,
            slug,
            prefix,
            github_repo_url,
            github_owner,
            github_repo,
            created_at,
            updated_at
          )
        `,
        )
        .eq("project_id", currentProject.id)
        .in("priority", ["urgent", "high", "medium", "low"])
        .not("status", "eq", "completed")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5);

      conditionalLog(actionName, { priorityTasksData, priorityError }, true);

      if (priorityError) {
        throw priorityError;
      }

      // Filter out tasks with null projects
      priorityTasks = priorityTasksData.filter(
        (task): task is TaskWithProject => Boolean(task.project),
      );
    }

    // Format tasks with URLs
    const formatTasks = (tasks: TaskWithProject[]): LayoutTask[] =>
      tasks.map(task => ({
        ...task,
        ordinalId: task.ordinal_id,
        url: configuration.paths.tasks.view({
          project_slug: task.project.slug,
          task_slug: task.slug,
        }),
        project: {
          slug: task.project.slug,
          name: task.project.name,
          prefix: task.project.prefix,
        },
      }));

    // Construct layout data
    const layoutData: LayoutData = {
      user: {
        id: user.id,
        name: profile?.display_name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        avatar: profile?.avatar_url || "",
      },
      currentProject,
      projects: projects || [],
      recentTasks: formatTasks(recentTasks),
      priorityTasks: formatTasks(priorityTasks),
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
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const setCurrentProjectAction = async (
  projectId: string,
): Promise<ActionResponse<null>> => {
  const actionName = "setCurrentProjectAction";
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    conditionalLog(actionName, { userData, userError }, true);

    if (!userData.user) {
      throw new Error("Not authenticated");
    }

    const { error } = await supabase
      .from("profiles")
      .update({ current_project_id: projectId })
      .eq("id", userData.user.id);

    conditionalLog(actionName, { error }, true);

    if (error) {
      throw error;
    }

    return getActionResponse({ data: null });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
