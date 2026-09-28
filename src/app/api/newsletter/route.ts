import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendNewsletterWelcomeEmailDetailed } from "@/services/email.service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { email, source } = body as { email?: string; source?: string };

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim()) || email.trim().length > 255) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if subscriber already exists in Supabase
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, email, is_active")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (checkError) {
      console.error("Supabase subscriber lookup error:", checkError.message);
    }

    let isNewSubscription = false;

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json({
          success: true,
          alreadySubscribed: true,
          message: "You're already subscribed to the DUSKK Inner Circle.",
        });
      } else {
        // Reactivate inactive subscription
        const { error: updateError } = await supabaseAdmin
          .from("newsletter_subscribers")
          .update({ is_active: true, source: typeof source === "string" ? source : "footer" })
          .eq("id", existing.id);

        if (updateError) {
          console.error("Supabase subscriber reactivation error:", updateError.message);
          return NextResponse.json(
            { success: false, message: "Unable to subscribe right now. Please try again." },
            { status: 500 }
          );
        }
        isNewSubscription = true;
      }
    } else {
      // Insert new subscriber into Supabase
      const { error: insertError } = await supabaseAdmin
        .from("newsletter_subscribers")
        .insert({
          email: normalizedEmail,
          is_active: true,
          source: typeof source === "string" ? source : "footer",
        });

      if (insertError) {
        // Handle race condition where record was created concurrently
        if (insertError.code === "23505" || insertError.message?.toLowerCase().includes("unique")) {
          return NextResponse.json({
            success: true,
            alreadySubscribed: true,
            message: "You're already subscribed to the DUSKK Inner Circle.",
          });
        }
        console.error("Supabase subscriber insert error:", insertError.message);
        return NextResponse.json(
          { success: false, message: "Unable to subscribe right now. Please try again." },
          { status: 500 }
        );
      }
      isNewSubscription = true;
    }

    // Send Welcome Email for new subscriptions
    if (isNewSubscription) {
      try {
        const emailResult = await sendNewsletterWelcomeEmailDetailed({
          email: normalizedEmail,
          couponCode: "WELCOME10",
        });

        if (!emailResult.success) {
          console.warn(`Newsletter welcome email could not be sent to ${normalizedEmail}: ${emailResult.error || "Unknown SMTP error"}`);
        }
      } catch (emailErr: any) {
        console.error("Newsletter welcome email dispatch exception:", emailErr?.message || "Internal error");
      }
    }

    return NextResponse.json({
      success: true,
      alreadySubscribed: false,
      message: "You're in! Welcome to the DUSKK Inner Circle.",
    });
  } catch (error: any) {
    console.error("POST /api/newsletter unhandled error:", error?.message || "Internal Server Error");
    return NextResponse.json(
      { success: false, message: "Unable to subscribe right now. Please try again." },
      { status: 500 }
    );
  }
}
