import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signUserToken, USER_TOKEN_COOKIE } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: customer, error } = await supabaseAdmin
      .from("customers")
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        customer_type,
        metadata,
        orders (
          id,
          order_number,
          status,
          grand_total,
          created_at,
          order_items (*)
        )
      `)
      .eq("email", normalizedEmail)
      .single();

    if (error || !customer) {
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 });
    }

    const storedHash = (customer.metadata as any)?.password_hash;
    if (!storedHash) {
      return NextResponse.json({ success: false, message: "Account has not set a password. Please register or reset password." }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, storedHash);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 });
    }

    const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();

    const token = signUserToken({
      id: customer.id,
      email: customer.email,
      name: fullName,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        id: customer.id,
        email: customer.email,
        name: fullName,
        phone: customer.phone,
        orders: customer.orders || [],
      },
    });

    response.cookies.set(USER_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
