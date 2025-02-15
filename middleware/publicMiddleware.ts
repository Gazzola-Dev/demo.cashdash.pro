import { conditionalLog } from "@/lib/log.utils";
import { NextRequest, NextResponse } from "next/server";

async function publicMiddleware(request: NextRequest, response: NextResponse) {
  const hookName = "Public Middleware";
  const pathname = request.nextUrl.pathname;
  const pathSegments = pathname.split("/").filter(Boolean);

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

  // Check public paths first
  if (publicPaths.includes(pathSegments[0])) {
    conditionalLog(hookName, { status: "public_path", pathname }, true);
    return NextResponse.next();
  }

  // Then check static and system paths
  if (
    pathname.startsWith("/svg/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/__nextjs") ||
    pathname.includes(".")
  ) {
    conditionalLog(hookName, { status: "bypassed", pathname }, true);
    return NextResponse.next();
  }

  return response;
}

export default publicMiddleware;
