import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. A valid recovery session or authentication token is required." },
        { status: 401 }
      );
    }

    // Verify recovery session token with Supabase Auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired recovery session. Please request a new reset link." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid new password (minimum 6 characters)." },
        { status: 400 }
      );
    }

    const normalizedEmail = userData.user.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update customer record metadata with new password hash
    const { data: customer, error: findError } = await supabaseAdmin
      .from("customers")
      .select("id, metadata")
      .eq("email", normalizedEmail)
      .single();

    if (customer) {
      await supabaseAdmin
        .from("customers")
        .update({
          metadata: {
            ...(customer.metadata || {}),
            password_hash: passwordHash,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", customer.id);
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been reset successfully. You may now log in with your new password.",
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to reset password." },
      { status: 500 }
    );
  }
}

