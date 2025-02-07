import createMiddlewareClient from "@/clients/middleware-client";
import configuration from "@/configuration";
import { conditionalLog } from "@/lib/log.utils";
import { Tables } from "@/types/database.types";
import { NextRequest, NextResponse } from "next/server";

type Profile = Tables<"profiles">;
type Project = Tables<"projects">;

async function userMiddleware(request: NextRequest, response: NextResponse) {
  const hookName = "userMiddleware";
  const supabase = createMiddlewareClient(request, response);
  const pathname = request.nextUrl.pathname;
  const pathSegments = pathname.split("/").filter(Boolean);

  // Determine if we should log this request
  const shouldLog =
    process.env.SERVER_DEBUG === "true" &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/api/");

  // Allow public assets and API routes to bypass middleware
  if (
    pathname.startsWith("/svg/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") // Skip files with extensions
  ) {
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
    return response;
  }

  // Get user session
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (shouldLog) {
    conditionalLog(hookName, { user, sessionError }, true);
  }

  if (sessionError || !user) {
    if (shouldLog) {
      conditionalLog(hookName, { error: "No authenticated user" }, true);
    }

    if (pathSegments[0] === "projects" && pathSegments[1] !== "new") {
      return NextResponse.redirect(
        new URL(configuration.paths.project.new, request.url),
      );
    }
    if (pathname === configuration.paths.project.new) return response;
    if (pathname === configuration.paths.appHome) return response;
    return NextResponse.redirect(
      new URL(configuration.paths.appHome, request.url),
    );
  }

  // Get user profile with current project
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, current_project_id")
    .eq("id", user.id)
    .single();

  if (shouldLog) {
    conditionalLog(hookName, { profile, profileError }, true);
  }

  if (profileError || !profile) {
    if (shouldLog) {
      conditionalLog(hookName, { error: "No profile found" }, true);
    }
    return NextResponse.redirect(
      new URL(configuration.paths.appHome, request.url),
    );
  }

  // Check if user has been invited
  if (!profile.invited) {
    if (shouldLog) {
      conditionalLog(hookName, { error: "User not invited" }, true);
    }
    return NextResponse.redirect(
      new URL(configuration.paths.invite, request.url),
    );
  }

  // Get user's project memberships
  const { data: memberships, error: membershipError } = await supabase
    .from("project_members")
    .select("project_id, projects(id, slug)")
    .eq("user_id", user.id);

  if (shouldLog) {
    conditionalLog(hookName, { memberships, membershipError }, true);
  }

  // Allow access to projects list and new project page for authenticated users
  if (
    pathname === configuration.paths.project.all ||
    pathname === configuration.paths.project.new
  ) {
    return response;
  }

  // If no memberships, redirect to new project page
  if (membershipError || !memberships?.length) {
    if (shouldLog) {
      conditionalLog(hookName, { error: "No project memberships found" }, true);
    }
    return NextResponse.redirect(
      new URL(configuration.paths.project.new, request.url),
    );
  }

  // Extract project slugs and find current project
  const projects = memberships
    .map(m => m.projects as Project)
    .filter((p): p is Project => !!p);
  const projectSlugs = projects.map(p => p.slug);
  const urlProjectSlug = pathSegments[0];

  if (shouldLog) {
    conditionalLog(
      hookName,
      { projects, projectSlugs, urlProjectSlug, pathSegments },
      true,
    );
  }

  // If no current project, assign first available project
  if (!profile.current_project_id) {
    const firstProject = projects[0];
    if (!firstProject) {
      if (shouldLog) {
        conditionalLog(hookName, { error: "No projects available" }, true);
      }
      return NextResponse.redirect(
        new URL(configuration.paths.project.new, request.url),
      );
    }

    // Update profile with current project
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ current_project_id: firstProject.id })
      .eq("id", user.id);

    if (shouldLog) {
      conditionalLog(hookName, { updateError, firstProject }, true);
    }

    // Redirect to overview of first project
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

  if (shouldLog) {
    conditionalLog(hookName, { currentProject }, true);
  }

  // If URL project slug doesn't match any user projects
  if (urlProjectSlug && !projectSlugs.includes(urlProjectSlug)) {
    if (shouldLog) {
      conditionalLog(
        hookName,
        { error: "URL project slug not found in user projects" },
        true,
      );
    }
    // Redirect to current project overview (or first project if current not found)
    const redirectProject = currentProject || projects[0];
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

      if (shouldLog) {
        conditionalLog(
          hookName,
          { updateError, newCurrentProject, currentProject },
          true,
        );
      }
    }
  }

  return response;
}

export default userMiddleware;
