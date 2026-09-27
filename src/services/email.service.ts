import nodemailer from "nodemailer";
import { formatPrice } from "@/lib/utils";

const SMTP_HOST = process.env.SMTP_HOST || "smtp-relay.brevo.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || "DUSKK <duskk.india@gmail.com>";
const DUSKK_NOTIFICATION_EMAIL = "duskk.india@gmail.com";

// Safe site URL helper (strictly avoids localhost in customer-facing emails)
function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || "https://duskk.in";
  if (url.includes("localhost") || !url.startsWith("http")) {
    return "https://duskk.in";
  }
  return url.replace(/\/$/, "");
}

const transporter =
  SMTP_USER && SMTP_PASSWORD && !SMTP_PASSWORD.includes("mock")
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: false, // TLS via port 587 STARTTLS
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASSWORD,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      })
    : null;

// Reusable Brand Email Layout Wrapper
function buildEmailTemplate(contentHtml: string): string {
  const siteUrl = getSiteUrl();
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DUSKK</title>
    </head>
    <body style="background-color: #FAF8F5; margin: 0; padding: 40px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); margin: auto; max-width: 600px; width: 100%;">
        <!-- Header -->
        <tr>
          <td align="center" style="padding: 32px 20px; background-color: #0F0F0F; color: #FFFFFF;">
            <h1 style="margin: 0; font-size: 26px; letter-spacing: 5px; font-weight: 400; color: #C5A880; font-family: Georgia, serif;">D U S K K</h1>
            <p style="margin: 6px 0 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #E5E5E5;">Thoughtful Gifts. Meaningful Moments.</p>
          </td>
        </tr>

        <!-- Content Area -->
        <tr>
          <td style="padding: 36px 32px;">
            ${contentHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding: 24px; background-color: #F4F4F4; color: #777777; font-size: 12px; line-height: 1.6; border-top: 1px solid #EAEAEA;">
            &copy; ${new Date().getFullYear()} DUSKK. All Rights Reserved.<br/>
            Email: <a href="mailto:duskk.india@gmail.com" style="color: #777777; text-decoration: underline;">duskk.india@gmail.com</a> &bull; Website: <a href="${siteUrl}" style="color: #777777; text-decoration: underline;">duskk.in</a><br/>
            Helpline: <a href="tel:+917503462516" style="color: #777777; text-decoration: underline;">+91 75034 62516</a> &bull; Help Desk: <a href="${siteUrl}/contact" style="color: #777777; text-decoration: underline;">duskk.in/contact</a>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ---------------------------------------------------------------------------
// 1. ORDER CONFIRMATION EMAIL
// ---------------------------------------------------------------------------
export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: {
    productName: string;
    productSku: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  financials: {
    subtotal: number;
    discount: number;
    shippingCharge: number;
    tax: number;
    totalAmount: number;
  };
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  const siteUrl = getSiteUrl();

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #EAEAEA;">
        <td style="padding: 12px 0;">
          <strong style="color: #111111; font-size: 14px;">${item.productName}</strong><br/>
          <span style="color: #666666; font-size: 12px;">SKU: ${item.productSku} &bull; Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 12px 0; text-align: right; font-weight: 500; color: #111111; font-size: 14px;">
          ${formatPrice(item.subtotal)}
        </td>
      </tr>
    `
    )
    .join("");

  const bodyContent = `
    <h2 style="font-size: 20px; color: #111111; margin: 0 0 12px 0; font-family: Georgia, serif;">Thank You for Your Order, ${data.customerName}!</h2>
    <p style="color: #444444; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
      Your order <strong style="color: #111111;">#${data.orderNumber}</strong> has been confirmed. Our team is now carefully preparing and inspecting your items before dispatch.
    </p>

    <div style="background-color: #FAF8F5; border-left: 4px solid #C5A880; padding: 14px 18px; margin-bottom: 28px; border-radius: 0 4px 4px 0;">
      <p style="margin: 0; font-size: 13px; color: #333333; line-height: 1.5;">
        <strong>Order Tracking:</strong> You can track your order status anytime at <a href="${siteUrl}/order/track" style="color: #9A7B4F; text-decoration: underline; font-weight: 600;">duskk.in/order/track</a> using your Order Number and Email Address.
      </p>
    </div>

    <!-- Items -->
    <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #111111; border-bottom: 2px solid #0F0F0F; padding-bottom: 8px; margin: 24px 0 12px 0;">Order Summary</h3>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${itemsHtml}
    </table>

    <!-- Financials -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px; font-size: 14px;">
      <tr>
        <td style="padding: 6px 0; color: #666666;">Subtotal</td>
        <td style="padding: 6px 0; text-align: right; color: #111111;">${formatPrice(data.financials.subtotal)}</td>
      </tr>
      ${
        data.financials.discount > 0
          ? `<tr>
              <td style="padding: 6px 0; color: #16a34a;">Coupon Discount</td>
              <td style="padding: 6px 0; text-align: right; color: #16a34a;">-${formatPrice(data.financials.discount)}</td>
            </tr>`
          : ""
      }
      <tr>
        <td style="padding: 6px 0; color: #666666;">Shipping</td>
        <td style="padding: 6px 0; text-align: right; color: #111111;">
          ${data.financials.shippingCharge === 0 ? "FREE" : formatPrice(data.financials.shippingCharge)}
        </td>
      </tr>
      <tr style="border-top: 1px solid #111111;">
        <td style="padding: 12px 0; font-weight: bold; font-size: 16px; color: #111111;">Total Paid</td>
        <td style="padding: 12px 0; font-weight: bold; font-size: 16px; text-align: right; color: #111111;">${formatPrice(data.financials.totalAmount)}</td>
      </tr>
    </table>

    <!-- Shipping Address Snapshot -->
    <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #EAEAEA;">
      <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #111111;">Delivery Address</h4>
      <p style="margin: 0; color: #555555; font-size: 13px; line-height: 1.5;">
        ${data.customerName}<br/>
        ${data.shippingAddress.addressLine1}${data.shippingAddress.addressLine2 ? `, ${data.shippingAddress.addressLine2}` : ""}<br/>
        ${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}
      </p>
    </div>
  `;

  const emailHtml = buildEmailTemplate(bodyContent);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: data.customerEmail,
        subject: `DUSKK Order Confirmation — ${data.orderNumber}`,
        html: emailHtml,
      });
      console.log(`📧 Order confirmation email sent to ${data.customerEmail} for #${data.orderNumber}`);
      return true;
    } catch (err: any) {
      console.warn("SMTP sendOrderConfirmationEmail failed safely:", err?.message || "Unknown error");
      return false;
    }
  } else {
    console.log(`📧 [MOCK EMAIL SERVICE] Order confirmation for #${data.orderNumber}`);
    return true;
  }
}

// ---------------------------------------------------------------------------
// 2. ORDER STATUS UPDATE EMAILS (SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)
// ---------------------------------------------------------------------------
export interface OrderStatusEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | string;
  amount?: number;
  reason?: string;
  trackingInfo?: {
    courierName?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
  };
}

export async function sendOrderStatusUpdateEmail(data: OrderStatusEmailData): Promise<boolean> {
  const siteUrl = getSiteUrl();
  let subject = `Update on your DUSKK Order #${data.orderNumber}`;
  let statusBadge = data.status;
  let statusBadgeColor = "#0F0F0F";
  let specificContent = "";

  const normStatus = data.status.toUpperCase();

  if (normStatus === "SHIPPED") {
    subject = `Your DUSKK Order #${data.orderNumber} Has Been Dispatched`;
    statusBadge = "DISPATCHED & IN TRANSIT";
    statusBadgeColor = "#2563EB";

    const hasTracking = data.trackingInfo?.courierName || data.trackingInfo?.trackingNumber;
    const trackingLink = data.trackingInfo?.trackingUrl || `${siteUrl}/order/track`;

    specificContent = `
      <p style="color: #444444; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
        Great news! Your order <strong style="color: #111111;">#${data.orderNumber}</strong> has been carefully packed and handed over to our courier partner.
      </p>

      ${
        hasTracking
          ? `
        <div style="background-color: #FAF8F5; border: 1px solid #E5DFD7; padding: 18px 20px; border-radius: 6px; margin: 20px 0;">
          <h4 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #111111;">Shipment Tracking Details</h4>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
            ${
              data.trackingInfo?.courierName
                ? `<tr><td style="padding: 4px 0; color: #666666; width: 140px;">Courier Partner:</td><td style="padding: 4px 0; color: #111111; font-weight: 500;">${data.trackingInfo.courierName}</td></tr>`
                : ""
            }
            ${
              data.trackingInfo?.trackingNumber
                ? `<tr><td style="padding: 4px 0; color: #666666;">AWB / Tracking No:</td><td style="padding: 4px 0; color: #111111; font-mono; font-weight: 600;">${data.trackingInfo.trackingNumber}</td></tr>`
                : ""
            }
            ${
              data.trackingInfo?.estimatedDelivery
                ? `<tr><td style="padding: 4px 0; color: #666666;">Est. Delivery:</td><td style="padding: 4px 0; color: #111111;">${data.trackingInfo.estimatedDelivery}</td></tr>`
                : ""
            }
          </table>
        </div>
      `
          : ""
      }

      <div style="text-align: center; margin: 28px 0;">
        <a href="${trackingLink}" style="display: inline-block; background-color: #0F0F0F; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
          Track Your Package
        </a>
      </div>
    `;
  } else if (normStatus === "OUT_FOR_DELIVERY") {
    subject = `Out for Delivery: Your DUSKK Order #${data.orderNumber}`;
    statusBadge = "OUT FOR DELIVERY TODAY";
    statusBadgeColor = "#D97706";

    specificContent = `
      <p style="color: #444444; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
        Your order <strong style="color: #111111;">#${data.orderNumber}</strong> is with our local delivery executive and is scheduled to be delivered to your address today.
      </p>

      <div style="background-color: #FAF8F5; border-left: 4px solid #D97706; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #333333; line-height: 1.5;">
          Please ensure someone is available at the delivery location to receive your package.
        </p>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${siteUrl}/order/track" style="display: inline-block; background-color: #0F0F0F; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
          View Live Tracking
        </a>
      </div>
    `;
  } else if (normStatus === "DELIVERED") {
    subject = `Delivered: Your DUSKK Order #${data.orderNumber}`;
    statusBadge = "DELIVERED";
    statusBadgeColor = "#16A34A";

    specificContent = `
      <p style="color: #444444; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
        Your order <strong style="color: #111111;">#${data.orderNumber}</strong> has been successfully delivered. We hope your DUSKK package brings delight and meaningful moments!
      </p>

      <div style="background-color: #FAF8F5; border: 1px solid #E5DFD7; padding: 16px 18px; border-radius: 6px; margin: 24px 0;">
        <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #111111; font-weight: 600;">Customer Support & Assistance</h4>
        <p style="margin: 0; font-size: 12px; color: #666666; line-height: 1.5;">
          If your item arrived damaged, defective, or incorrect, please report it within <strong>48 hours of delivery</strong> through our <a href="${siteUrl}/contact" style="color: #9A7B4F; text-decoration: underline;">Contact Desk</a> or by emailing <a href="mailto:duskk.india@gmail.com" style="color: #9A7B4F; text-decoration: underline;">duskk.india@gmail.com</a> with photographs.
        </p>
      </div>
    `;
  } else if (normStatus === "CANCELLED") {
    subject = `DUSKK Order Cancellation — #${data.orderNumber}`;
    statusBadge = "CANCELLED";
    statusBadgeColor = "#DC2626";

    specificContent = `
      <p style="color: #444444; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
        Your order <strong style="color: #111111;">#${data.orderNumber}</strong> has been cancelled.
      </p>

      ${
        data.reason
          ? `
        <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 14px 18px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #991B1B;">
            <strong>Reason for cancellation:</strong> ${data.reason.replace(/\| \[TRACKING\].*$/, "")}
          </p>
        </div>
      `
          : ""
      }

      ${
        data.amount && data.amount > 0
          ? `
        <p style="color: #555555; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;">
          If your payment of <strong>${formatPrice(data.amount)}</strong> was already processed, our team is initiating the refund back to your original payment method.
        </p>
      `
          : ""
      }
    `;
  } else {
    specificContent = `
      <p style="color: #444444; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
        Your order <strong style="color: #111111;">#${data.orderNumber}</strong> has been updated to: <strong>${data.status}</strong>.
      </p>
    `;
  }

  const bodyContent = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; background-color: ${statusBadgeColor}; color: #FFFFFF; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 10px; border-radius: 3px;">
        ${statusBadge}
      </span>
    </div>

    <h2 style="font-size: 20px; color: #111111; margin: 0 0 12px 0; font-family: Georgia, serif;">Hello, ${data.customerName}</h2>
    ${specificContent}

    <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #EAEAEA;">
      <p style="margin: 0; font-size: 12px; color: #777777;">
        Order Reference: <strong>#${data.orderNumber}</strong> &bull; Need help? Reach us at <a href="mailto:duskk.india@gmail.com" style="color: #777777; text-decoration: underline;">duskk.india@gmail.com</a>
      </p>
    </div>
  `;

  const emailHtml = buildEmailTemplate(bodyContent);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: data.customerEmail,
        subject,
        html: emailHtml,
      });
      console.log(`📧 Status update (${normStatus}) sent to ${data.customerEmail} for #${data.orderNumber}`);
      return true;
    } catch (err: any) {
      console.warn(`SMTP sendOrderStatusUpdateEmail (${normStatus}) failed safely:`, err?.message || "Unknown error");
      return false;
    }
  } else {
    console.log(`📧 [MOCK EMAIL SERVICE] Status update (${normStatus}) for #${data.orderNumber}`);
    return true;
  }
}

// ---------------------------------------------------------------------------
// 3. REFUND CONFIRMATION EMAIL
// ---------------------------------------------------------------------------
export interface RefundEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  refundAmount: number;
  refundReference?: string;
  refundStatus?: string;
}

export async function sendRefundEmail(data: RefundEmailData): Promise<boolean> {
  const subject = `DUSKK Refund Confirmation — Order #${data.orderNumber}`;

  const bodyContent = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #16A34A; color: #FFFFFF; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 10px; border-radius: 3px;">
        REFUND PROCESSED
      </span>
    </div>

    <h2 style="font-size: 20px; color: #111111; margin: 0 0 12px 0; font-family: Georgia, serif;">Refund Confirmation for ${data.customerName}</h2>
    <p style="color: #444444; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      A refund for your order <strong style="color: #111111;">#${data.orderNumber}</strong> has been successfully initiated.
    </p>

    <div style="background-color: #FAF8F5; border: 1px solid #E5DFD7; padding: 18px 20px; border-radius: 6px; margin: 20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #666666;">Refund Amount:</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #111111; font-size: 16px;">
            ${formatPrice(data.refundAmount)}
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666666;">Order Number:</td>
          <td style="padding: 6px 0; text-align: right; color: #111111; font-mono;">
            #${data.orderNumber}
          </td>
        </tr>
        ${
          data.refundReference
            ? `
          <tr>
            <td style="padding: 6px 0; color: #666666;">Refund Reference:</td>
            <td style="padding: 6px 0; text-align: right; color: #111111; font-mono; font-size: 12px;">
              ${data.refundReference}
            </td>
          </tr>
        `
            : ""
        }
      </table>
    </div>

    <p style="color: #666666; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;">
      The refunded amount will be credited back to your original source payment method (card, UPI, or bank account). It typically takes <strong>5 to 7 business days</strong> to reflect in your statement depending on your bank&apos;s processing cycle.
    </p>

    <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #EAEAEA;">
      <p style="margin: 0; font-size: 12px; color: #777777;">
        Questions about this refund? Contact us at <a href="mailto:duskk.india@gmail.com" style="color: #777777; text-decoration: underline;">duskk.india@gmail.com</a>
      </p>
    </div>
  `;

  const emailHtml = buildEmailTemplate(bodyContent);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: data.customerEmail,
        subject,
        html: emailHtml,
      });
      console.log(`📧 Refund confirmation email sent to ${data.customerEmail} for #${data.orderNumber}`);
      return true;
    } catch (err: any) {
      console.warn("SMTP sendRefundEmail failed safely:", err?.message || "Unknown error");
      return false;
    }
  } else {
    console.log(`📧 [MOCK EMAIL SERVICE] Refund confirmation for #${data.orderNumber}`);
    return true;
  }
}

// ---------------------------------------------------------------------------
// 4. CONTACT FORM NOTIFICATION (TO DUSKK TEAM)
// ---------------------------------------------------------------------------
export interface ContactNotificationData {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  submittedAt?: string;
}

export async function sendContactFormNotification(data: ContactNotificationData): Promise<boolean> {
  const timestamp = data.submittedAt || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";

  const bodyContent = `
    <div style="margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #C5A880; color: #0F0F0F; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 10px; border-radius: 3px;">
        NEW CUSTOMER INQUIRY
      </span>
    </div>

    <h2 style="font-size: 18px; color: #111111; margin: 0 0 16px 0; font-family: Georgia, serif;">Contact Form Submission</h2>

    <div style="background-color: #FAF8F5; border: 1px solid #E5DFD7; padding: 18px 20px; border-radius: 6px; margin-bottom: 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #666666; width: 120px;"><strong>Name:</strong></td>
          <td style="padding: 6px 0; color: #111111;">${data.name}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666666;"><strong>Email:</strong></td>
          <td style="padding: 6px 0; color: #111111;"><a href="mailto:${data.email}" style="color: #9A7B4F; text-decoration: underline;">${data.email}</a></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666666;"><strong>Phone:</strong></td>
          <td style="padding: 6px 0; color: #111111;">${data.phone || "Not provided"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666666;"><strong>Subject:</strong></td>
          <td style="padding: 6px 0; color: #111111;">${data.subject}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666666;"><strong>Received At:</strong></td>
          <td style="padding: 6px 0; color: #777777;">${timestamp}</td>
        </tr>
      </table>
    </div>

    <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #111111;">Message:</h4>
    <div style="background-color: #FFFFFF; border: 1px solid #E5E5E5; padding: 16px; border-radius: 4px; color: #333333; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${data.message}</div>
  `;

  const emailHtml = buildEmailTemplate(bodyContent);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: DUSKK_NOTIFICATION_EMAIL,
        replyTo: data.email,
        subject: `DUSKK Contact Inquiry — ${data.subject}`,
        html: emailHtml,
      });
      console.log(`📧 Contact form notification delivered to ${DUSKK_NOTIFICATION_EMAIL} from ${data.email}`);
      return true;
    } catch (err: any) {
      console.warn("SMTP sendContactFormNotification failed safely:", err?.message || "Unknown error");
      return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// 5. CONTACT FORM ACKNOWLEDGEMENT (TO CUSTOMER)
// ---------------------------------------------------------------------------
export interface ContactAcknowledgementData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactFormAcknowledgement(data: ContactAcknowledgementData): Promise<boolean> {
  const subject = `We received your message — DUSKK`;

  const bodyContent = `
    <h2 style="font-size: 20px; color: #111111; margin: 0 0 12px 0; font-family: Georgia, serif;">Hello ${data.name},</h2>
    <p style="color: #444444; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      Thank you for contacting DUSKK.<br/>
      We have received your enquiry and our team will get back to you.
    </p>

    <div style="background-color: #FAF8F5; border: 1px solid #E5DFD7; padding: 16px 18px; border-radius: 6px; margin: 20px 0;">
      <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #777777;">Subject: ${data.subject}</h4>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #444444; line-height: 1.5; white-space: pre-wrap;">${data.message}</p>
    </div>

    <p style="color: #666666; font-size: 13px; line-height: 1.5; margin: 20px 0 0 0;">
      DUSKK<br/>
      <a href="mailto:duskk.india@gmail.com" style="color: #9A7B4F; text-decoration: underline;">duskk.india@gmail.com</a>
    </p>
  `;

  const emailHtml = buildEmailTemplate(bodyContent);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: data.email,
        subject,
        html: emailHtml,
      });
      console.log(`📧 Contact form acknowledgement sent to customer: ${data.email}`);
      return true;
    } catch (err: any) {
      console.warn("SMTP sendContactFormAcknowledgement failed safely:", err?.message || "Unknown error");
      return false;
    }
  }
  return true;
}
