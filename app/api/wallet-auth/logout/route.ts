import { NextRequest, NextResponse } from "next/server";
import cookie from "cookie";

import { cookieName } from "@/app/utils/supabase";

export async function POST(
  _req: NextRequest,
  _res: NextResponse
) {

  return new Response('Logged out', {
    status: 200,
    headers: { 'Set-Cookie': cookie.serialize(cookieName, "", {
      path: "/",
      maxAge: -1,
    }) },
  })
}