import createMiddlewareClient from "@/clients/middleware-client";
import { NextRequest, NextResponse } from "next/server";

async function sessionMiddleware(request: NextRequest, response: NextResponse) {
  const supabase = createMiddlewareClient(request, response);

  await supabase.auth.getSession();

  return response;
}

export default sessionMiddleware;
