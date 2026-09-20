import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signUserToken, USER_TOKEN_COOKIE } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: "Please provide name, email, and password" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(" ") || null;
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || "https://duskk.in";

    // 1. Sign up via Supabase Auth (Triggers Brevo Custom SMTP verification email)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: name.trim(),
          phone: phone?.trim() || null,
        },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (authError) {
      console.warn("Supabase Auth signUp note:", authError.message);
      // If user already registered in Supabase Auth
      if (authError.message.includes("already registered")) {
        return NextResponse.json(
          { success: false, message: "An account with this email already exists. Please log in." },
          { status: 400 }
        );
      }
    }

    const authUserId = authData?.user?.id || null;
    const passwordHash = await bcrypt.hash(password, 10);

    // 2. Ensure customer profile is linked and updated
    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("id, customer_type, metadata")
      .eq("email", normalizedEmail)
      .single();

    let customerId: string;

    if (existingCustomer) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("customers")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone?.trim() || undefined,
          auth_user_id: authUserId || undefined,
          customer_type: "registered",
          metadata: {
            ...(existingCustomer.metadata || {}),
            password_hash: passwordHash,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingCustomer.id)
        .select()
        .single();

      if (updateError || !updated) {
        throw new Error("Failed to register customer account");
      }
      customerId = updated.id;
    } else {
      const { data: created, error: createError } = await supabaseAdmin
        .from("customers")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: normalizedEmail,
          phone: phone?.trim() || null,
          auth_user_id: authUserId,
          customer_type: "registered",
          metadata: {
            password_hash: passwordHash,
          },
        })
        .select()
        .single();

      if (createError || !created) {
        throw new Error("Failed to create customer profile");
      }
      customerId = created.id;
    }

    const token = signUserToken({
      id: customerId,
      email: normalizedEmail,
      name: name.trim(),
    });

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully! A verification email has been sent to your inbox.",
      data: {
        id: customerId,
        email: normalizedEmail,
        name: name.trim(),
        emailConfirmationSent: !authData?.session,
      },
    });

    response.cookies.set(USER_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("User registration error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
