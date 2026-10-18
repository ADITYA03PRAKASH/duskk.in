import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { signAdminToken, ADMIN_TOKEN_COOKIE } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

function safeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Environment-configured administrator credentials (must be explicitly configured)
    const envAdminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim().toLowerCase() : null;
    const envAdminPassword = process.env.ADMIN_PASSWORD || null;

    let isValid = false;
    let adminId = "admin_master";
    let adminName = "DUSKK Administrator";
    let adminRole = "SUPER_ADMIN";

    // 1. Authenticate via configured server environment variables (constant-time comparison)
    if (
      envAdminEmail &&
      envAdminPassword &&
      safeCompare(normalizedEmail, envAdminEmail) &&
      safeCompare(password, envAdminPassword)
    ) {
      isValid = true;
    } else {
      // 2. Authenticate via database-backed admin accounts
      const { data: customer } = await supabaseAdmin
        .from("customers")
        .select("id, first_name, last_name, email, metadata")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (customer) {
        const metadata = (customer.metadata as any) || {};
        if (metadata.is_admin && metadata.password_hash) {
          const match = await bcrypt.compare(password, metadata.password_hash);
          if (match) {
            isValid = true;
            adminId = customer.id;
            adminName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || "Admin";
            adminRole = metadata.admin_role || "ADMIN";
          }
        }
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid administrative credentials" },
        { status: 401 }
      );
    }

    const token = signAdminToken({
      id: adminId,
      email: normalizedEmail,
      name: adminName,
      role: adminRole,
    });

    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful",
      admin: {
        id: adminId,
        email: normalizedEmail,
        name: adminName,
        role: adminRole,
      },
    });

    response.cookies.set(ADMIN_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication service error" },
      { status: 500 }
    );
  }
}
