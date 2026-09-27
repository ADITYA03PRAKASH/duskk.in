import { NextRequest, NextResponse } from "next/server";
import {
  sendContactFormNotification,
  sendContactFormAcknowledgement,
} from "@/services/email.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    // Strict input validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Please provide your name." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, message: "Please provide your inquiry message." },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone && typeof phone === "string" ? phone.trim() : null;
    const trimmedSubject = subject && typeof subject === "string" && subject.trim() ? subject.trim() : "Store Inquiry";
    const trimmedMessage = message.trim();
    const submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";

    // 1. Send direct email notification to DUSKK (duskk.india@gmail.com)
    const emailSent = await sendContactFormNotification({
      name: trimmedName,
      email: normalizedEmail,
      phone: trimmedPhone,
      subject: trimmedSubject,
      message: trimmedMessage,
      submittedAt,
    });

    if (!emailSent) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to send your message. Please try again.",
        },
        { status: 500 }
      );
    }

    // 2. Asynchronously send customer acknowledgement (non-blocking)
    sendContactFormAcknowledgement({
      name: trimmedName,
      email: normalizedEmail,
      subject: trimmedSubject,
      message: trimmedMessage,
    }).catch((err) => {
      console.warn("Customer contact acknowledgement note:", err?.message || "Unknown error");
    });

    // 3. Return success only after email confirmed sent
    return NextResponse.json({
      success: true,
      message: "Thank you for contacting DUSKK. Your message has been delivered to our concierge team.",
    });
  } catch (error: any) {
    console.error("POST /api/contact error:", error?.message || "Unknown error");
    return NextResponse.json(
      { success: false, message: "Failed to process contact inquiry." },
      { status: 500 }
    );
  }
}
