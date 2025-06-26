
import { cookieName } from "@/app/utils/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest, 
) {

  const response = NextResponse.json({
    message: "Logged out"
  });

  response.cookies.set(cookieName, "", {
    path: "/",
    secure: process.env.NODE_ENV === "production", // Only HTTPS in production
    httpOnly: true, // ✅ Prevent XSS attacks
    sameSite: "strict", // ✅ Prevent CSRF attacks
    maxAge: 0,
  });

  return response;

}