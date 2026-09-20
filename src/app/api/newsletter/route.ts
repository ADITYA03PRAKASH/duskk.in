import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .upsert(
        { email: normalizedEmail, is_active: true, source: source || "footer" },
        { onConflict: "email" }
      );

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Welcome to the DUSKK Circle. You have been subscribed successfully.",
    });
  } catch (error: any) {
    console.error("POST /api/newsletter error:", error);
    return NextResponse.json(
      { success: false, message: "Subscription failed." },
      { status: 500 }
    );
  }
}
