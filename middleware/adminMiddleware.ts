import createMiddlewareClient from "@/clients/middleware-client";
import configuration from "@/configuration";
import { NextRequest, NextResponse } from "next/server";

async function adminMiddleware(request: NextRequest, response: NextResponse) {
  const pathname = request.nextUrl.pathname;
  const supabase = createMiddlewareClient(request, response);

  // Define protected routes that require admin access
  const isProtectedRoute =
    pathname.endsWith("/projects/new") || pathname.endsWith("/tasks/new");

  if (!isProtectedRoute) return response;

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    // If no authenticated user, redirect to home
    return NextResponse.redirect(
      new URL(configuration.paths.appHome, request.url),
    );
  }

  // Check if user has admin role
  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin");

  if (rolesError || !roles.length) {
    // User is not an admin, redirect based on the route
    if (pathname.endsWith("/projects/new")) {
      return NextResponse.redirect(
        new URL(configuration.paths.project.all, request.url),
      );
    }

    // For /tasks/new, extract project slug from URL to redirect to project tasks
    const projectSlug = pathname.split("/")[1]; // URL format: /:project_slug/tasks/new
    if (projectSlug) {
      return NextResponse.redirect(
        new URL(
          configuration.paths.tasks.all({ project_slug: projectSlug }),
          request.url,
        ),
      );
    }

    // Fallback to home if we can't determine the redirect
    return NextResponse.redirect(
      new URL(configuration.paths.appHome, request.url),
    );
  }

  return response;
}

export default adminMiddleware;
