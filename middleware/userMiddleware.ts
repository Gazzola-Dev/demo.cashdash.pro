import { getUserInvitesAction } from "@/actions/invite.actions";
import { listProjectsAction } from "@/actions/project.actions";
import createMiddlewareClient from "@/clients/middleware-client";
import configuration from "@/configuration";
import { conditionalLog } from "@/lib/log.utils";
import { NextRequest, NextResponse } from "next/server";

async function middleware(request: NextRequest, response: NextResponse) {
  const hookName = "middleware";
  const pathname = request.nextUrl.pathname;
  const pathSegments = pathname.split("/").filter(Boolean);
  const supabase = createMiddlewareClient(request, response);

  // Skip logging for static assets and API routes
  const shouldLog =
    process.env.SERVER_DEBUG === "true" &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/api/");

  // Allow public assets, API routes, and Next.js internal routes to bypass middleware
  if (
    pathname.startsWith("/svg/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/__nextjs") ||
    pathname.includes(".")
  ) {
    conditionalLog(hookName, { status: "bypassed", pathname }, shouldLog);
    return response;
  }

  // Public paths that don't require authentication
  const publicPaths = [
    "settings",
    "support",
    "feedback",
    "privacy",
    "terms",
    "404",
    "about",
    "invite",
  ];

  if (publicPaths.includes(pathSegments[0])) {
    conditionalLog(hookName, { status: "public_path", pathname }, shouldLog);
    return response;
  }

  // Get user session
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    conditionalLog(
      hookName,
      { status: "unauthenticated", sessionError },
      shouldLog,
    );

    if (pathname !== configuration.paths.appHome)
      return NextResponse.redirect(
        new URL(configuration.paths.appHome, request.url),
      );
    return response;
  }

  // Check if route requires admin access
  const isAdminRoute =
    pathname === configuration.paths.project.new ||
    pathname ===
      configuration.paths.tasks.new({ project_slug: pathSegments?.[1] });

  if (isAdminRoute) {
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (rolesError || !roles.length) {
      conditionalLog(
        hookName,
        { status: "admin_required", rolesError },
        shouldLog,
      );
      return NextResponse.redirect(
        new URL(configuration.paths.appHome, request.url),
      );
    }
  }

  // Get user profile with current project
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, current_project_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    conditionalLog(
      hookName,
      { status: "no_profile", user_id: user.id, profileError },
      shouldLog,
    );
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(configuration.paths.appHome, request.url),
    );
  }

  const { data: invites } = await getUserInvitesAction();
  const { data: projects } = await listProjectsAction();

  if (!projects?.length && !invites?.invitations.length) {
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");
    const isAdmin = !!roles?.length;
    if (isAdmin) return response;
    if (!isAdmin) {
      conditionalLog(
        hookName,
        { status: "no_memberships_or_invites", user_id: user.id },
        shouldLog,
      );
      await supabase.auth.signOut();
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
        invites_count: invites?.invitations.length,
      },
      shouldLog,
    );
    return response;
  }

  // Extract project slugs and find current project
  const projectSlugs = projects?.map(p => p.slug);
  const urlProjectSlug = pathSegments[0];

  // Skip project slug validation for Next.js internal routes
  if (urlProjectSlug?.startsWith("__nextjs")) {
    return response;
  }

  // If no current project, assign first available project using SECURITY DEFINER function
  if (!profile.current_project_id && projects.length) {
    const firstProject = projects?.[0];
    if (!firstProject) {
      conditionalLog(
        hookName,
        { status: "no_projects_available", user_id: user.id },
        shouldLog,
      );
      return NextResponse.redirect(
        new URL(configuration.paths.project.new, request.url),
      );
    }

    // Call the SECURITY DEFINER function to update current project
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
      shouldLog,
    );

    if (updateError) {
      // Log error but don't fail - user can still access the app
      conditionalLog(
        hookName,
        { status: "update_error", error: updateError },
        shouldLog,
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
    p => p.id === profile.current_project_id,
  );

  // Check if user has an invitation for the requested project
  const hasInviteForProject = invites?.invitations.some(
    invite => invite.project.slug === urlProjectSlug,
  );

  // If URL project slug doesn't match any user projects and user has no invitation
  if (
    urlProjectSlug &&
    !projectSlugs?.includes(urlProjectSlug) &&
    !hasInviteForProject &&
    urlProjectSlug !== "projects"
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
      shouldLog,
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

  // If URL project slug doesn't match current project
  if (
    currentProject &&
    urlProjectSlug &&
    urlProjectSlug !== currentProject.slug &&
    !hasInviteForProject
  ) {
    // Update current project to match URL
    const newCurrentProject = projects?.find(p => p.slug === urlProjectSlug);
    if (newCurrentProject) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ current_project_id: newCurrentProject.id })
        .eq("id", user.id);

      conditionalLog(
        hookName,
        {
          status: "project_switch",
          user_id: user.id,
          old_project: currentProject.slug,
          new_project: newCurrentProject.slug,
          updateError,
        },
        shouldLog,
      );
    }
  }

  conditionalLog(
    hookName,
    {
      status: "normal_access",
      user_id: user.id,
      current_project: profile.current_project_id,
      pathname,
    },
    shouldLog,
  );

  return response;
}

export default middleware;
