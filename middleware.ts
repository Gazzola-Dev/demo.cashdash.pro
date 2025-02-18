import configuration from "@/configuration";
import { allTaskSlugs, demoProjects } from "@/data/demo.db";
import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|favicon-light\\.svg|favicon-dark\\.svg).*)",
  ],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const secondSegment = segments[1];
  const thirdSegment = segments[2];

  const projectSlugs = demoProjects.map(project => project.slug);
  const pathIsHome = pathname === "/";

  // If we're on the home page or have no segments, allow the request
  if (pathIsHome || segments.length === 0) {
    return NextResponse.next();
  }

  // Validate first segment
  const firstSegmentIsValid =
    firstSegment && projectSlugs.includes(firstSegment);

  // If first segment isn't valid, redirect to home
  if (!firstSegmentIsValid) {
    return NextResponse.redirect(
      new URL(configuration.paths.appHome, request.url),
    );
  }

  // If only one segment and it's valid, allow
  if (segments.length === 1) {
    return NextResponse.next();
  }

  // Validate second segment
  const secondSegmentIsValid =
    secondSegment &&
    (allTaskSlugs.includes(secondSegment) ||
      ["tasks", "kanban", "timeline", "prototype"].includes(secondSegment));

  // If second segment isn't valid, redirect to first valid segment
  if (!secondSegmentIsValid) {
    return NextResponse.redirect(new URL(`/${firstSegment}`, request.url));
  }

  // If only two segments and they're valid, allow
  if (segments.length === 2) {
    return NextResponse.next();
  }

  // For third segment, only allow "new" under tasks
  const thirdSegmentIsValid =
    secondSegment === "tasks" && thirdSegment === "new";

  // If third segment isn't valid, redirect to first two valid segments
  if (!thirdSegmentIsValid) {
    return NextResponse.redirect(
      new URL(`/${firstSegment}/${secondSegment}`, request.url),
    );
  }

  // If we reach here, all segments are valid
  return NextResponse.next();
}
