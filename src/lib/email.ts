import nodemailer from "nodemailer";
import type { Order } from "@/types";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/data/site";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return null;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string }> {
  const from = process.env.SMTP_FROM || `"${SITE.name}" <${SITE.email}>`;
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`📧 [EMAIL NOTIFICATION] To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${text || html.replace(/<[^>]*>?/gm, " ").trim()}`);
    console.log(`======================================================\n`);
    return { success: true, messageId: `slh-mail-${Date.now()}` };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, " ").trim(),
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("📧 [EMAIL SEND ERROR]:", error);
    return { success: false };
  }
}

/* ──────────────── ACCOUNT & AUTH EMAILS ──────────────── */

export async function sendLoginAlertEmail({
  email,
  name,
  time = new Date().toLocaleString(),
}: {
  email: string;
  name: string;
  time?: string;
}) {
  const subject = `Login Notification – ${SITE.name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; border: 1px solid #e5e5e5;">
      <h2 style="font-size: 22px; font-weight: normal; letter-spacing: 2px; text-transform: uppercase; text-align: center; margin-bottom: 24px;">
        ${SITE.name}
      </h2>
      <p style="font-size: 15px; line-height: 1.6;">Hello ${name || "Customer"},</p>
      <p style="font-size: 15px; line-height: 1.6;">
        We noticed a recent sign-in to your ${SITE.name} account on <strong>${time}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #555;">
        If this was you, no action is needed. If you did not sign in, please reset your password immediately or contact our concierge support.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      <p style="font-size: 12px; color: #888; text-align: center;">
        ${SITE.name} Boutique · MM Alam Road, Gulberg 2, Lahore · WhatsApp: +${SITE.whatsapp}
      </p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
}

export async function sendPasswordResetCodeEmail({
  email,
  name,
  resetCode,
}: {
  email: string;
  name: string;
  resetCode: string;
}) {
  const subject = `Password Reset Code – ${SITE.name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; border: 1px solid #e5e5e5;">
      <h2 style="font-size: 22px; font-weight: normal; letter-spacing: 2px; text-transform: uppercase; text-align: center; margin-bottom: 24px;">
        ${SITE.name}
      </h2>
      <p style="font-size: 15px; line-height: 1.6;">Hello ${name || "Customer"},</p>
      <p style="font-size: 15px; line-height: 1.6;">
        We received a request to reset your password. Use the verification code below to set a new password:
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <span style="display: inline-block; padding: 12px 28px; background-color: #111111; color: #ffffff; font-size: 24px; letter-spacing: 6px; font-family: monospace; font-weight: bold;">
          ${resetCode}
        </span>
      </div>
      <p style="font-size: 13px; line-height: 1.6; color: #666;">
        This code is valid for 15 minutes. If you did not request this, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      <p style="font-size: 12px; color: #888; text-align: center;">
        ${SITE.name} · ${SITE.email} · Lahore, Pakistan
      </p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
}

export async function sendProfileUpdatedNotificationEmail({
  email,
  name,
  updatedFields,
}: {
  email: string;
  name: string;
  updatedFields: string[];
}) {
  const subject = `Your ${SITE.name} Account Profile Has Been Updated`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; border: 1px solid #e5e5e5;">
      <h2 style="font-size: 22px; font-weight: normal; letter-spacing: 2px; text-transform: uppercase; text-align: center; margin-bottom: 24px;">
        ${SITE.name}
      </h2>
      <p style="font-size: 15px; line-height: 1.6;">Hello ${name || "Customer"},</p>
      <p style="font-size: 15px; line-height: 1.6;">
        Your account profile was successfully updated. The following detail(s) were modified:
      </p>
      <ul style="font-size: 14px; line-height: 1.8; color: #333;">
        ${updatedFields.map((f) => `<li><strong>${f}</strong></li>`).join("")}
      </ul>
      <p style="font-size: 13px; color: #666; margin-top: 20px;">
        If you did not authorize these changes, please reach out to our team immediately at <a href="mailto:${SITE.email}">${SITE.email}</a>.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      <p style="font-size: 12px; color: #888; text-align: center;">
        ${SITE.name} Customer Care
      </p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
}

/* ──────────────── ORDER CONFIRMATION EMAIL ──────────────── */

export async function sendOrderConfirmationEmail(order: Order) {
  const subject = `Order Confirmation #${order.orderNumber} – ${SITE.name}`;
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
          <div style="font-weight: bold; font-size: 14px;">${item.title}</div>
          <div style="font-size: 12px; color: #666;">Size: ${item.size}${item.dupatta ? ` | Sleeves: ${item.dupatta}` : ""}${item.adOn ? ` | ${item.adOn}` : ""}</div>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 14px;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-size: 14px; font-weight: bold;">
          ${formatPrice(item.price * item.quantity)}
        </td>
      </tr>
    `
    )
    .join("");

  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; padding: 28px; color: #1a1a1a; border: 1px solid #e5e5e5;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 26px; font-weight: normal; letter-spacing: 3px; text-transform: uppercase; margin: 0;">
          ${SITE.name}
        </h1>
        <p style="font-size: 13px; color: #777; margin-top: 6px;">Thank you for your order</p>
      </div>

      <div style="background: #fbfbfb; border: 1px solid #ebebeb; padding: 18px; margin-bottom: 24px;">
        <div style="font-size: 14px; margin-bottom: 6px;">
          <strong>Order Number:</strong> ${order.orderNumber}
        </div>
        <div style="font-size: 14px; margin-bottom: 6px;">
          <strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()} (${order.paymentStatus.toUpperCase()})
        </div>
        <div style="font-size: 14px;">
          <strong>Shipping To:</strong> ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.country}
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="border-bottom: 1px solid #ccc; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #777;">
            <th style="padding-bottom: 8px;">Item</th>
            <th style="padding-bottom: 8px; text-align: center;">Qty</th>
            <th style="padding-bottom: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="text-align: right; font-size: 14px; line-height: 1.8;">
        <div>Subtotal: <strong>${formatPrice(order.subtotal)}</strong></div>
        ${order.discount ? `<div>Discount: <strong>-${formatPrice(order.discount)}</strong></div>` : ""}
        <div>Shipping: <strong>${order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</strong></div>
        <div style="font-size: 18px; border-top: 1px solid #ccc; padding-top: 8px; margin-top: 8px;">
          Total: <strong>${formatPrice(order.total)}</strong>
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0 20px;" />
      <p style="font-size: 12px; color: #777; text-align: center;">
        Need assistance with your order? Reach our atelier on WhatsApp: +${SITE.whatsapp} or email <a href="mailto:${SITE.email}">${SITE.email}</a>.
      </p>
    </div>
  `;

  return sendEmail({ to: order.customer.email, subject, html });
}

/* ──────────────── CONTACT FORM NOTIFICATION ──────────────── */

export async function sendContactFormNotification({
  name,
  email,
  phone,
  subject,
  message,
}: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  // 1. Notify store owner
  const adminSubject = `[Inquiry] ${subject || "New Customer Message"} from ${name}`;
  const adminHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
      <h2>New Contact Form Inquiry</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
      <p><strong>Subject:</strong> ${subject || "General Inquiry"}</p>
      <p><strong>Message:</strong></p>
      <div style="background: #f7f7f7; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${message}</div>
    </div>
  `;
  await sendEmail({ to: SITE.email, subject: adminSubject, html: adminHtml });

  // 2. Auto-reply to customer
  const customerSubject = `We have received your message – ${SITE.name}`;
  const customerHtml = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; border: 1px solid #e5e5e5;">
      <h2 style="font-size: 22px; font-weight: normal; letter-spacing: 2px; text-transform: uppercase; text-align: center; margin-bottom: 24px;">
        ${SITE.name}
      </h2>
      <p style="font-size: 15px; line-height: 1.6;">Hello ${name},</p>
      <p style="font-size: 15px; line-height: 1.6;">
        Thank you for contacting ${SITE.name}. We have received your inquiry regarding <strong>${subject || "General Inquiry"}</strong> and our atelier team will respond to you shortly.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #555;">
        For urgent bridal or bespoke consultations, you can also reach us directly via WhatsApp at <strong>+${SITE.whatsapp}</strong>.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      <p style="font-size: 12px; color: #888; text-align: center;">
        ${SITE.name} Boutique · MM Alam Road, Gulberg 2, Lahore
      </p>
    </div>
  `;
  return sendEmail({ to: email, subject: customerSubject, html: customerHtml });
}

/* ──────────────── DISCOUNT CODE EMAIL ──────────────── */

export async function sendDiscountCodeEmail({
  email,
  code,
  percent = 5,
}: {
  email: string;
  code: string;
  percent?: number;
}) {
  const subject = `Your Exclusive ${percent}% Welcome Discount Code: ${code} – ${SITE.name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a; border: 1px solid #e5e5e5; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 26px; font-weight: normal; letter-spacing: 3px; text-transform: uppercase; margin: 0;">
          ${SITE.name}
        </h1>
        <p style="font-size: 13px; color: #888; margin-top: 6px; letter-spacing: 1px;">HAUTE COUTURE &amp; FESTIVE LUXURY</p>
      </div>

      <p style="font-size: 15px; line-height: 1.6;">Hello,</p>
      <p style="font-size: 15px; line-height: 1.6;">
        Thank you for joining the ${SITE.name} inner circle. As a token of our appreciation, here is your exclusive <strong>${percent}% discount code</strong> for your next purchase of luxury Pakistani designer wear:
      </p>

      <div style="margin: 28px 0; text-align: center;">
        <div style="display: inline-block; background: #f7f7f7; border: 2px dashed #111111; padding: 16px 36px; border-radius: 4px;">
          <span style="font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #111111;">
            ${code}
          </span>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 8px;">
          Enter this code at checkout to claim your ${percent}% discount.
        </p>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="https://sillhouete.com/collections/new-arrivals" style="background: #111111; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; display: inline-block;">
          Shop New Arrivals
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 28px 0 20px;" />
      <p style="font-size: 12px; color: #888; text-align: center; line-height: 1.6;">
        ${SITE.name} Boutique · Almas Tower, MM Alam Road, Gulberg 2, Lahore<br />
        Worldwide Express Shipping Available
      </p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

