import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || "https://duskk.in";

    // Triggers Supabase Auth password reset email via Brevo SMTP
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${siteUrl}/auth/reset-password`,
    });

    if (error) {
      console.error("Supabase resetPasswordForEmail error:", error.message);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists for this email, a password reset link has been dispatched to your inbox.",
    });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to send reset instructions." },
      { status: 500 }
    );
  }
}
