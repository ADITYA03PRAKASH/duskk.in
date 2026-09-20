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

    // Triggers Supabase Auth Magic Link email via Brevo SMTP
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      console.error("Supabase signInWithOtp error:", error.message);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Magic login link has been sent to your email address.",
    });
  } catch (err: any) {
    console.error("Magic link error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to send magic link." },
      { status: 500 }
    );
  }
}
