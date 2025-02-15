import csrffMiddleware from "@/middleware/csrfMiddleware";
import projectMiddleware from "@/middleware/projectMiddleware";
import publicMiddleware from "@/middleware/publicMiddleware";
import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|favicon-light\\.svg|favicon-dark\\.svg).*)",
  ],
};

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const csrfResponse = await csrffMiddleware(request, response);
  const publicResponse = await publicMiddleware(request, csrfResponse);
  const projectResponse = await projectMiddleware(request, publicResponse);
  return projectResponse;
}
