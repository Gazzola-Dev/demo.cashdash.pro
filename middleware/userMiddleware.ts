import { getUserInvitesAction } from "@/actions/invite.actions";
import createMiddlewareClient from "@/clients/middleware-client";
import configuration from "@/configuration";
import { conditionalLog } from "@/lib/log.utils";
import { Tables } from "@/types/database.types";
import { NextRequest, NextResponse } from "next/server";

type Profile = Tables<"profiles">;
type Project = Tables<"projects">;

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
    pathname.startsWith("/__nextjs") || // Add this line to handle Next.js internal routes
    pathname.includes(".") // Skip files with extensions
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
    const redirectUrl =
      pathSegments[0] === "projects" && pathSegments[1] !== "new"
        ? configuration.paths.project.new
        : pathname === configuration.paths.project.new ||
            pathname === configuration.paths.appHome
          ? pathname
          : configuration.paths.appHome;

    conditionalLog(
      hookName,
      { status: "unauthenticated", redirectUrl, sessionError },
      shouldLog,
    );

    return redirectUrl === pathname
      ? response
      : NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Check if route requires admin access
  const isProtectedRoute =
    pathname.endsWith("/projects/new") ||
    pathname.endsWith("/tasks/new") ||
    pathname.endsWith("/projects/all");

  if (isProtectedRoute) {
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (rolesError || !roles.length) {
      let redirectUrl = configuration.paths.appHome;

      if (pathname.endsWith("/projects/new")) {
        redirectUrl = configuration.paths.project.all;
      } else {
        // For /tasks/new, extract project slug to redirect to project tasks
        const projectSlug = pathSegments[0];
        if (projectSlug) {
          redirectUrl = configuration.paths.tasks.all({
            project_slug: projectSlug,
          });
        }
      }

      conditionalLog(
        hookName,
        { status: "admin_required", redirectUrl, rolesError },
        shouldLog,
      );
      return NextResponse.redirect(new URL(redirectUrl, request.url));
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
  const { data: memberships } = await supabase
    .from("project_members")
    .select("project_id, projects(id, slug)")
    .eq("user_id", user.id);

  // Allow access to projects list and new project page for authenticated users
  if (
    pathname === configuration.paths.project.all ||
    pathname === configuration.paths.project.new
  ) {
    conditionalLog(
      hookName,
      { status: "project_access_allowed", pathname, user_id: user.id },
      shouldLog,
    );
    return response;
  }

  if (!memberships?.length && !invites?.invitations.length) {
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");
    if (rolesError || !roles.length) {
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

  if (!memberships?.length) {
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
  const projects = memberships
    .map(m => m.projects as Project)
    .filter((p): p is Project => !!p);
  const projectSlugs = projects.map(p => p.slug);
  const urlProjectSlug = pathSegments[0];

  // Skip project slug validation for Next.js internal routes
  if (urlProjectSlug?.startsWith("__nextjs")) {
    return response;
  }

  // If no current project, assign first available project
  if (!profile.current_project_id) {
    const firstProject = projects[0];
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

    // Update profile with current project
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ current_project_id: firstProject.id })
      .eq("id", user.id);

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

    return NextResponse.redirect(
      new URL(
        configuration.paths.project.overview({
          project_slug: firstProject.slug,
        }),
        request.url,
      ),
    );
  }

  // Find the current project from memberships
  const currentProject = projects.find(
    p => p.id === profile.current_project_id,
  );

  // If URL project slug doesn't match any user projects
  if (urlProjectSlug && !projectSlugs.includes(urlProjectSlug)) {
    const redirectProject = currentProject || projects[0];
    conditionalLog(
      hookName,
      {
        status: "invalid_project_slug",
        user_id: user.id,
        attempted_slug: urlProjectSlug,
        redirect_to: redirectProject.slug,
      },
      shouldLog,
    );
    return NextResponse.redirect(
      new URL(
        configuration.paths.project.overview({
          project_slug: redirectProject.slug,
        }),
        request.url,
      ),
    );
  }

  // If URL project slug doesn't match current project
  if (
    currentProject &&
    urlProjectSlug &&
    urlProjectSlug !== currentProject.slug
  ) {
    // Update current project to match URL
    const newCurrentProject = projects.find(p => p.slug === urlProjectSlug);
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
  } else {
    conditionalLog(
      hookName,
      {
        status: "normal_access",
        user_id: user.id,
        current_project: currentProject?.slug,
        pathname,
      },
      shouldLog,
    );
  }

  return response;
}

export default middleware;
