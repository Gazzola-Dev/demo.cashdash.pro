import adminMiddleware from "@/middleware/adminMiddleware";
import csrffMiddleware from "@/middleware/csrfMiddleware";
import userMiddleware from "@/middleware/userMiddleware";
import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|favicon-light\\.svg|favicon-dark\\.svg).*)",
  ],
};

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const csrfResponse = await csrffMiddleware(request, response);
  const adminResponse = await adminMiddleware(request, csrfResponse);
  const userResponse = await userMiddleware(request, adminResponse);
  return userResponse;
}
