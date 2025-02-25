import createMiddlewareClient from "@/clients/middleware-client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create a Supabase client specifically for the middleware
  const supabase = createMiddlewareClient(req, res);

  // This will refresh the session if needed and set the auth cookie
  await supabase.auth.getSession();

  return res;
}

// Apply this middleware to all routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
