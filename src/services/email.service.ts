import nodemailer from "nodemailer";
import { formatPrice } from "@/lib/utils";

const SMTP_HOST = process.env.SMTP_HOST || "smtp-relay.brevo.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "b9ea8f001@smtp-brevo.com";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || "DUSKK <Duskk.india@gmail.com>";

const transporter =
  SMTP_USER && SMTP_PASSWORD && !SMTP_PASSWORD.includes("mock")
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: false, // TLS via port 587
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASSWORD,
        },
      })
    : null;

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

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #E5E5E5;">
        <td style="padding: 12px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <strong style="color: #111111;">${item.productName}</strong><br/>
          <span style="color: #666; font-size: 12px;">SKU: ${item.productSku} &bull; Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 12px 0; text-align: right; font-weight: 500; color: #111111; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          ${formatPrice(item.subtotal)}
        </td>
      </tr>
    `
    )
    .join("");

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>DUSKK Order Confirmation - ${data.orderNumber}</title>
    </head>
    <body style="background-color: #FAF8F5; margin: 0; padding: 40px 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin: auto;">
        <!-- Header -->
        <tr>
          <td align="center" style="padding: 36px 20px; background-color: #0F0F0F; color: #FFFFFF;">
            <h1 style="margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: 400; color: #C5A880;">D U S K K</h1>
            <p style="margin: 8px 0 0 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #E5E5E5;">Modern Luxury Jewellery</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding: 36px 32px;">
            <h2 style="font-size: 20px; color: #111111; margin: 0 0 12px 0;">Thank You for Your Order, ${data.customerName}!</h2>
            <p style="color: #444444; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
              Your order <strong style="color: #111111;">#${data.orderNumber}</strong> has been confirmed. Our master jewelers are now carefully preparing and inspecting your items before dispatch.
            </p>

            <div style="background-color: #FAF8F5; border-left: 4px solid #C5A880; padding: 14px 18px; margin-bottom: 28px;">
              <p style="margin: 0; font-size: 13px; color: #333333;">
                <strong>Order Tracking:</strong> You can track your order status anytime at <a href="${process.env.NEXT_PUBLIC_API_URL || "https://duskk.in"}/order/track" style="color: #C5A880; text-decoration: underline;">duskk.in/order/track</a> using your Order Number and Email Address.
              </p>
            </div>

            <!-- Items -->
            <h3 style="font-size: 15px; text-transform: uppercase; letter-spacing: 1px; color: #111111; border-bottom: 2px solid #0F0F0F; padding-bottom: 8px; margin: 24px 0 12px 0;">Order Summary</h3>
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
            <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #E5E5E5;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #111111;">Delivery Address</h4>
              <p style="margin: 0; color: #555555; font-size: 13px; line-height: 1.5;">
                ${data.customerName}<br/>
                ${data.shippingAddress.addressLine1}${data.shippingAddress.addressLine2 ? `, ${data.shippingAddress.addressLine2}` : ""}<br/>
                ${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding: 24px; background-color: #F4F4F4; color: #777777; font-size: 12px; line-height: 1.5;">
            &copy; 2026 DUSKK Jewels. All Rights Reserved. &bull; support@duskk.in &bull; duskk.in<br/>
            Plot no. 152-153 Sidhatri Enclave, Bhagwati Garden, Uttam Nagar, New Delhi 110059<br/>
            Concierge: +91 75034 62516 / +91 91426 01081
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: data.customerEmail,
        subject: `DUSKK Order Confirmation — ${data.orderNumber}`,
        html: emailHtml,
      });
      console.log(`📧 Order confirmation email sent to ${data.customerEmail} for order ${data.orderNumber}`);
      return true;
    } catch (err) {
      console.warn("SMTP send failed, logged email locally:", err);
    }
  } else {
    console.log(`📧 [MOCK EMAIL SERVICE] Order confirmation sent to ${data.customerEmail} for #${data.orderNumber}`);
  }

  return true;
}

export async function sendOrderStatusUpdateEmail(
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  newStatus: string
) {
  console.log(`📧 [ORDER STATUS UPDATE] Order #${orderNumber} is now: ${newStatus} (Sent to ${customerEmail})`);
  return true;
}
