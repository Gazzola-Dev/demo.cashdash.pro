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

  const firstSegment = pathname.split("/")[1];
  const secondSegment = pathname.split("/")[2];
  const projectSlugs = demoProjects.map(project => project.slug);

  if (
    (firstSegment && !projectSlugs.includes(firstSegment)) ||
    (secondSegment && !allTaskSlugs.includes(secondSegment))
  ) {
    return NextResponse.redirect(
      new URL(configuration.paths.appHome, request.url),
    );
  }

  const response = NextResponse.next();
  return response;
}
