import { getUserInvitesAction } from "@/actions/invite.actions";
import { listProjectsAction } from "@/actions/project.actions";
import createMiddlewareClient from "@/clients/middleware-client";
import configuration, { firstRouteSegments } from "@/configuration";
import { conditionalLog } from "@/lib/log.utils";
import { NextRequest, NextResponse } from "next/server";

async function projectMiddleware(request: NextRequest, response: NextResponse) {
  const hookName = "middleware";
  const pathname = request.nextUrl.pathname;
  const supabase = createMiddlewareClient(request, response);
  const pathSegments = pathname.split("/").filter(Boolean);
  const urlProjectSlug = pathSegments[0];
  const isKnownRoute = firstRouteSegments.includes(urlProjectSlug);

  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    conditionalLog(hookName, { status: "unauthenticated", sessionError }, true);
    if (!isKnownRoute && pathname !== configuration.paths.appHome) {
      return NextResponse.redirect(
        new URL(configuration.paths.appHome, request.url),
      );
    }
    return response;
  }

  // Check if route requires admin access
  const isAdminRoute =
    pathname === configuration.paths.project.new ||
    pathname ===
      configuration.paths.tasks.new({ project_slug: pathSegments?.[1] });

  const { data: invites } = await getUserInvitesAction();
  const { data: projects } = await listProjectsAction();

  const pendingInvites = invites?.invitations.filter(
    invite => invite.status === "pending",
  );

  if (isAdminRoute || (!projects?.length && !pendingInvites?.length)) {
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user?.id || "")
      .eq("role", "admin");

    if (rolesError || !roles.length) {
      conditionalLog(
        hookName,
        {
          status: isAdminRoute ? "admin_required" : "no_memberships_or_invites",
          user_id: user?.id,
          roles,
          rolesError,
        },
        true,
      );
      return NextResponse.redirect(
        new URL(configuration.paths.appHome, request.url),
      );
    }
  }

  if (!projects?.length) {
    conditionalLog(
      hookName,
      {
        status: "has_invites_only",
        user_id: user.id,
        pendingInvites_count: pendingInvites?.length,
      },
      true,
    );
    return response;
  }

  // Extract project slugs and find current project
  const projectSlugs = projects?.map(p => p.slug);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, current_project_id")
    .eq("id", user.id)
    .single();

  // If no current project, assign first available project using SECURITY DEFINER function
  if (!profile?.current_project_id && projects.length) {
    const firstProject = projects?.[0];
    if (!firstProject) {
      conditionalLog(
        hookName,
        { status: "no_projects_available", user_id: user.id },
        true,
      );
      if (pathname !== configuration.paths.appHome) {
        return NextResponse.redirect(
          new URL(configuration.paths.appHome, request.url),
        );
      }
      return NextResponse.next();
    }

    const { error: updateError } = await supabase.rpc(
      "set_user_current_project",
      {
        p_user_id: user.id,
        p_project_id: firstProject.id,
      },
    );

    conditionalLog(
      hookName,
      {
        status: "assigned_first_project",
        user_id: user.id,
        project_id: firstProject.id,
        updateError,
      },
      true,
    );

    if (updateError) {
      // Log error but don't fail - user can still access the app
      conditionalLog(
        hookName,
        { status: "update_error", error: updateError },
        true,
      );
    }

    return NextResponse.redirect(
      new URL(
        configuration.paths.project.overview({
          project_slug: firstProject.slug,
        }),
        request.url,
      ),
    );
  }

  const currentProject = projects?.find(
    p => p.id === profile?.current_project_id,
  );

  // Check if user has an invitation for the requested project
  const hasInviteForProject = invites?.invitations.some(
    invite => invite.project.slug === urlProjectSlug,
  );

  const isKnownProject = projectSlugs?.includes(urlProjectSlug);
  if (
    urlProjectSlug &&
    !isKnownRoute &&
    !isKnownProject &&
    !hasInviteForProject
  ) {
    const redirectProject = currentProject || projects?.[0];
    conditionalLog(
      hookName,
      {
        status: "invalid_project_slug",
        user_id: user.id,
        attempted_slug: urlProjectSlug,
        redirect_to: redirectProject?.slug,
      },
      true,
    );

    return NextResponse.redirect(
      new URL(
        redirectProject
          ? configuration.paths.project.overview({
              project_slug: redirectProject?.slug,
            })
          : configuration.paths.appHome,
        request.url,
      ),
    );
  }

  if (
    currentProject &&
    urlProjectSlug &&
    urlProjectSlug !== currentProject.slug &&
    !hasInviteForProject
  ) {
    // Update current project to match URL
    const newCurrentProject = projects?.find(p => p.slug === urlProjectSlug);
    if (newCurrentProject) {
      const { error: updateError } = await supabase.rpc(
        "set_user_current_project",
        {
          p_user_id: user.id,
          p_project_id: newCurrentProject.id,
        },
      );

      conditionalLog(
        hookName,
        {
          status: "project_switch",
          user_id: user.id,
          old_project: currentProject.slug,
          new_project: newCurrentProject.slug,
          updateError,
        },
        true,
      );
    }
  }

  conditionalLog(
    hookName,
    {
      status: "normal_access",
      user_id: user.email,
      current_project: currentProject?.slug,
      pathname,
    },
    true,
  );
  return response;
}

export default projectMiddleware;
