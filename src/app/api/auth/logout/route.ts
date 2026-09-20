import { NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.delete(USER_TOKEN_COOKIE);
  return response;
}
