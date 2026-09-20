import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: "Please provide name, email, and your inquiry message." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      subject: subject?.trim() || "Store Inquiry",
      message: message.trim(),
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for contacting DUSKK. Our concierge will get back to you shortly.",
    });
  } catch (error: any) {
    console.error("POST /api/contact error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit message." },
      { status: 500 }
    );
  }
}
