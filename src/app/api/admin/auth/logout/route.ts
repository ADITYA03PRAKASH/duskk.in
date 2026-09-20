import { NextResponse } from "next/server";
import { ADMIN_TOKEN_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Admin logged out successfully",
  });

  response.cookies.delete(ADMIN_TOKEN_COOKIE);
  return response;
}
