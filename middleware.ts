import configuration, { secondRouteSegments } from "@/configuration";
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
  const [firstSegment, secondSegment, thirdSegment] = segments;
  const projectSlugs = demoProjects.map(project => project.slug);
  const pathIsHome = pathname === "/";

  const log = (action: string, reason: string, destination?: string) => {
    console.log(
      `MIDDLEWARE | path: ${pathname} | segments: [${segments.join(",")}] | action: ${action} | reason: ${reason}${destination ? ` | destination: ${destination}` : ""}`,
    );
  };

  if (pathIsHome || segments.length === 0) {
    log("allow", "home or no segments");
    return NextResponse.next();
  }

  const firstSegmentIsValid =
    firstSegment && projectSlugs.includes(firstSegment);
  if (!firstSegmentIsValid) {
    log("redirect", "invalid first segment", configuration.paths.appHome);
    return NextResponse.redirect(
      new URL(configuration.paths.appHome, request.url),
    );
  }

  if (segments.length === 1) {
    log("allow", "valid single segment");
    return NextResponse.next();
  }

  const secondSegmentIsValid =
    secondSegment &&
    (allTaskSlugs.includes(secondSegment) ||
      secondRouteSegments.includes(secondSegment));
  if (!secondSegmentIsValid) {
    log("redirect", "invalid second segment", `/${firstSegment}`);
    return NextResponse.redirect(new URL(`/${firstSegment}`, request.url));
  }

  if (segments.length === 2) {
    log("allow", "valid two segments");
    return NextResponse.next();
  }

  const thirdSegmentIsValid =
    secondSegment === "tasks" && thirdSegment === "new";
  if (!thirdSegmentIsValid) {
    log(
      "redirect",
      "invalid third segment",
      `/${firstSegment}/${secondSegment}`,
    );
    return NextResponse.redirect(
      new URL(`/${firstSegment}/${secondSegment}`, request.url),
    );
  }

  log("allow", "all segments valid");
  return NextResponse.next();
}
