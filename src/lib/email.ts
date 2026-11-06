import nodemailer, { type Transporter } from "nodemailer";
import type { Order } from "@/types";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/data/site";
import { NotificationModel, type NotificationType, type NotificationDeliveryStatus } from "./models/Notification";
import { SiteSettingsModel } from "./models/SiteSettings";
import connectDB from "./mongodb";

/* ──────────────── HTML & HEADER SANITIZATION ──────────────── */

export function escapeHtml(str: string = ""): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function sanitizeHeader(str: string = ""): string {
  return String(str).replace(/[\r\n]+/g, " ").trim();
}

export function isValidEmail(email: string = ""): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/* ──────────────── NODEMAILER TRANSPORTER ──────────────── */

interface TransporterContext {
  transporter: Transporter;
  user: string;
  from: string;
}

export async function getTransporter(): Promise<TransporterContext | null> {
  let host = process.env.SMTP_HOST || "smtp.gmail.com";
  let port = Number(process.env.SMTP_PORT) || 465;
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;
  let customFrom = process.env.SMTP_FROM;

  // If environment variables are not set (e.g. on Vercel deployment), read directly from MongoDB SiteSettings
  if (!user || !pass) {
    try {
      await connectDB();
      const settings = await SiteSettingsModel.findOne({}).lean();
      if (settings?.smtpUser && settings?.smtpPass) {
        user = settings.smtpUser;
        pass = settings.smtpPass;
        host = settings.smtpHost || host;
        port = Number(settings.smtpPort) || port;
        if (settings.smtpFrom) {
          customFrom = settings.smtpFrom;
        }
      }
    } catch (err) {
      console.error("📧 [EMAIL ERROR] Failed to load SMTP settings from MongoDB:", err);
    }
  }

  if (host && user && pass) {
    const cleanPass = pass.replace(/\s+/g, "");
    const cleanUser = user.trim();
    const isPort465 = Number(port) === 465;

    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: isPort465,
      auth: { user: cleanUser, pass: cleanPass },
      connectionTimeout: 12000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });

    const from =
      customFrom ||
      (cleanUser ? `"SILLHOUETE" <${cleanUser}>` : `"SILLHOUETE" <saleemalbala18@gmail.com>`);

    return { transporter, user: cleanUser, from };
  }

  return null;
}

export async function verifySmtpConnection(): Promise<{ success: boolean; error?: string; user?: string }> {
  const context = await getTransporter();
  if (!context) {
    return {
      success: false,
      error: "SMTP credentials (user or password) are not configured. Please enter them in Admin Settings.",
    };
  }
  try {
    await context.transporter.verify();
    return { success: true, user: context.user };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "SMTP verification failed";
    return { success: false, error: msg, user: context.user };
  }
}

export interface SendEmailResult {
  success: boolean;
  status: NotificationDeliveryStatus;
  messageId?: string;
  error?: string;
}

/**
 * Dispatch real customer email via configured SMTP (Gmail / Custom SMTP)
 */
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
}): Promise<SendEmailResult> {
  const cleanTo = sanitizeHeader(to);
  const cleanSubject = sanitizeHeader(subject);

  if (!isValidEmail(cleanTo)) {
    return {
      success: false,
      status: "failed",
      error: `Invalid recipient email address: "${cleanTo}"`,
    };
  }

  const context = await getTransporter();

  if (!context) {
    console.warn(`📧 [EMAIL NOT CONFIGURED] Intended Recipient: ${cleanTo}`);
    return {
      success: false,
      status: "failed",
      messageId: `not-configured-${Date.now()}`,
      error: "SMTP not configured. Please configure your Gmail/SMTP settings in Admin Settings.",
    };
  }

  const { transporter, from } = context;

  try {
    const info = await transporter.sendMail({
      from,
      to: cleanTo,
      subject: cleanSubject,
      text: text || html.replace(/<[^>]*>?/gm, " ").trim(),
      html,
    });

    console.log(`📧 [EMAIL DELIVERED] To: ${cleanTo} | Subject: ${cleanSubject} | ID: ${info.messageId}`);
    return {
      success: true,
      status: "sent",
      messageId: info.messageId,
    };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "SMTP transport failure";
    console.error("📧 [EMAIL SEND ERROR]:", errMsg);
    return {
      success: false,
      status: "failed",
      error: errMsg,
    };
  }
}

/**
 * Tracked notification helper with MongoDB Outbox logging and Idempotency:
 * - Prevents duplicate emails for identical event triggers via unique idempotencyKey.
 * - Records attempt count, errors, and delivery timestamps in MongoDB.
 * - Email failures are safely logged and will never crash or fail payment webhooks.
 */
export async function sendTrackedNotification({
  orderId,
  orderNumber,
  type,
  recipient,
  subject,
  html,
  text,
  idempotencyKey,
}: {
  orderId?: string;
  orderNumber?: string;
  type: NotificationType;
  recipient: string;
  subject: string;
  html: string;
  text?: string;
  idempotencyKey: string;
}): Promise<SendEmailResult & { notificationId?: string }> {
  try {
    await connectDB();

    // 1. Check idempotency: only skip if already successfully delivered
    const existing = await NotificationModel.findOne({ idempotencyKey });
    if (existing && existing.status === "sent") {
      console.log(`[Notification] Already sent notification (${existing.type}) for key: ${idempotencyKey}. Skipping duplicate.`);
      return {
        success: true,
        status: "sent",
        messageId: existing.messageId,
      };
    }

    const notificationId = existing?.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 2. Dispatch email
    const result = await sendEmail({ to: recipient, subject, html, text });

    // 3. Persist record in MongoDB Notification Outbox
    await NotificationModel.findOneAndUpdate(
      { idempotencyKey },
      {
        $set: {
          id: notificationId,
          orderId,
          orderNumber,
          type,
          recipient,
          subject,
          html,
          text,
          status: result.status,
          messageId: result.messageId,
          lastError: result.error,
          sentAt: result.status === "sent" ? new Date() : undefined,
        },
        $inc: { attempts: 1 },
      },
      { upsert: true, new: true }
    );

    return { ...result, notificationId };
  } catch (dbErr) {
    console.warn("[Notification Tracking Warning]: Failed to persist notification record to MongoDB:", dbErr);
    // Even if tracking DB has an issue, attempt direct send so customer communication isn't dropped
    const fallback = await sendEmail({ to: recipient, subject, html, text });
    return fallback;
  }
}

/* ──────────────── BRANDED EMAIL LOGO HEADER HELPER ──────────────── */

function getEmailBrandHeader(badgeHtml = ""): string {
  return `
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="https://sillhouete.com" target="_blank" style="display: inline-block; text-decoration: none;">
        <img src="${SITE.logo}" alt="${SITE.name}" style="height: 44px; width: auto; max-width: 190px; margin: 0 auto 10px; display: block; border: 0;" />
      </a>
      <h1 style="font-size: 24px; font-weight: normal; letter-spacing: 3px; text-transform: uppercase; margin: 0; color: #111111;">
        ${SITE.name}
      </h1>
      ${badgeHtml}
    </div>
  `;
}

function getSimpleEmailHeader(): string {
  return `
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="https://sillhouete.com" target="_blank" style="display: inline-block; text-decoration: none;">
        <img src="${SITE.logo}" alt="${SITE.name}" style="height: 40px; width: auto; max-width: 170px; margin: 0 auto 8px; display: block; border: 0;" />
      </a>
      <div style="font-size: 20px; font-weight: normal; letter-spacing: 2.5px; text-transform: uppercase; color: #111111;">
        ${SITE.name}
      </div>
    </div>
  `;
}

/* ──────────────── 1. ORDER CONFIRMATION EMAIL ──────────────── */

export async function sendOrderConfirmationEmail(order: Order, isCod = false) {
  const isBank = order.paymentMethod === "bank_transfer" || order.paymentMethod === "bank_deposit";
  const isStripe = order.paymentMethod === "credit_card" || order.paymentMethod === "stripe";

  const safeCustomerName = escapeHtml(order.customer.name || "Valued Customer");
  const safeOrderNumber = escapeHtml(order.orderNumber);

  let paymentHeaderBadge = "ORDER CONFIRMED";
  let paymentNoticeHtml = "";

  if (isStripe) {
    const cardBrand = order.paymentDetails?.brand ? escapeHtml(order.paymentDetails.brand.toUpperCase()) : "CARD";
    const last4 = order.paymentDetails?.last4 ? escapeHtml(order.paymentDetails.last4) : "****";
    paymentHeaderBadge = "PAYMENT VERIFIED & ORDER CONFIRMED";
    paymentNoticeHtml = `
      <div style="background: #e8f5e9; border: 1px solid #c8e6c9; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px; font-size: 13.5px; color: #2e7d32;">
        <strong>✓ Payment Verified by Stripe:</strong> Your card payment of <strong>${formatPrice(order.total)}</strong> (${cardBrand} •••• ${last4}) has been successfully processed and verified.
      </div>
    `;
  } else if (isCod || order.paymentMethod === "cod") {
    paymentHeaderBadge = "CASH ON DELIVERY ORDER PLACED";
    paymentNoticeHtml = `
      <div style="background: #fff8e1; border: 1px solid #ffe082; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px; font-size: 13.5px; color: #7c6000;">
        <strong>Cash on Delivery:</strong> Please have <strong>${formatPrice(order.total)}</strong> ready in cash upon delivery at your doorstep.
      </div>
    `;
  } else if (isBank) {
    paymentHeaderBadge = "BANK DEPOSIT ORDER RESERVED";
    paymentNoticeHtml = `
      <div style="background: #fff8e1; border: 1px solid #ffe082; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px; font-size: 13.5px; color: #7c6000;">
        <strong>Bank Deposit Action Required:</strong> Please transfer <strong>${formatPrice(order.total)}</strong> to:
        <div style="margin-top: 6px; font-family: monospace; font-size: 13px;">
          Bank: <strong>Meezan Bank</strong> | Title: <strong>SILLHOUETE</strong><br />
          IBAN: <strong>PK80MEZN0002160109517881</strong>
        </div>
        Please WhatsApp your payment receipt to +${SITE.whatsapp} to confirm dispatch.
      </div>
    `;
  }

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
          <div style="font-weight: bold; font-size: 14px; color: #1a1a1a;">${escapeHtml(item.title)}</div>
          <div style="font-size: 12px; color: #666; margin-top: 3px;">
            Size: ${escapeHtml(item.size)}
            ${item.dupatta ? ` | Sleeves: ${escapeHtml(item.dupatta)}` : ""}
            ${item.adOn ? ` | ${escapeHtml(item.adOn)}` : ""}
          </div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 14px;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-size: 14px; font-weight: bold; color: #1a1a1a;">
          ${formatPrice(item.price * item.quantity)}
        </td>
      </tr>
    `
    )
    .join("");

  const subject = `Order Confirmation #${order.orderNumber} – ${SITE.name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; padding: 28px; color: #1a1a1a; border: 1px solid #e5e5e5; background: #ffffff;">
      ${getEmailBrandHeader(`<p style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #777; margin-top: 6px;">${paymentHeaderBadge}</p>`)}

      <p style="font-size: 15px; line-height: 1.6;">Hello ${safeCustomerName},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #444;">
        Thank you for choosing ${SITE.name}. Your order has been registered and is being prepared with artisanal care by our atelier.
      </p>

      ${paymentNoticeHtml}

      <div style="background: #fbfbfb; border: 1px solid #ebebeb; padding: 16px 18px; border-radius: 6px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.6;">
        <div><strong>Order Number:</strong> ${safeOrderNumber}</div>
        <div><strong>Payment Method:</strong> ${escapeHtml(order.paymentMethod.toUpperCase())}</div>
        <div><strong>Order Status:</strong> ${escapeHtml(order.status.toUpperCase())}</div>
        <div><strong>Shipping Destination:</strong> ${escapeHtml(order.shippingAddress.address)}, ${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.country)}</div>
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
        Need assistance with sizing or bespoke adjustments? Reach our concierge on WhatsApp: +${SITE.whatsapp} or email <a href="mailto:${SITE.email}">${SITE.email}</a>.
      </p>
    </div>
  `;

  return sendTrackedNotification({
    orderId: order.id,
    orderNumber: order.orderNumber,
    type: "order_confirmation",
    recipient: order.customer.email,
    subject,
    html,
    idempotencyKey: `notif_order_confirm_${order.id}`,
  });
}

/* ──────────────── 2. PAYMENT FAILURE EMAIL ──────────────── */

export async function sendPaymentFailureEmail(order: Order, failureReason?: string) {
  const safeCustomerName = escapeHtml(order.customer.name || "Customer");
  const safeOrderNumber = escapeHtml(order.orderNumber);
  const safeReason = escapeHtml(failureReason || "Your card was declined or could not be authorized by your card issuer.");

  const subject = `Payment Unsuccessful for Order #${order.orderNumber} – ${SITE.name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; padding: 28px; color: #1a1a1a; border: 1px solid #e5e5e5; background: #ffffff;">
      ${getEmailBrandHeader(`<p style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #c62828; margin-top: 6px;">PAYMENT UNSUCCESSFUL</p>`)}

      <p style="font-size: 15px; line-height: 1.6;">Hello ${safeCustomerName},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #444;">
        We were unable to process your payment for Order <strong>#${safeOrderNumber}</strong>. Please note that your card has <strong>not</strong> been charged, and your order has <strong>not</strong> been confirmed.
      </p>

      <div style="background: #ffebee; border: 1px solid #ffcdd2; padding: 14px 18px; border-radius: 6px; margin: 20px 0; font-size: 13.5px; color: #b71c1c;">
        <strong>Reason:</strong> ${safeReason}
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #444;">
        This commonly occurs due to international payment restrictions, insufficient balance, or security authorization requirements with your bank.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="https://sillhouete.com/checkout" style="background: #111111; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 13px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; display: inline-block; border-radius: 4px;">
          Retry Payment on Website
        </a>
      </div>

      <p style="font-size: 13px; color: #666; text-align: center;">
        Alternatively, you can contact our team via WhatsApp at +${SITE.whatsapp} for personalized checkout assistance.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0 20px;" />
      <p style="font-size: 12px; color: #777; text-align: center;">
        ${SITE.name} Boutique · MM Alam Road, Gulberg 2, Lahore · <a href="mailto:${SITE.email}">${SITE.email}</a>
      </p>
    </div>
  `;

  return sendTrackedNotification({
    orderId: order.id,
    orderNumber: order.orderNumber,
    type: "payment_failure",
    recipient: order.customer.email,
    subject,
    html,
    idempotencyKey: `notif_payment_fail_${order.id}_${Date.now()}`,
  });
}

/* ──────────────── 3. ORDER CANCELLATION EMAIL ──────────────── */

export async function sendOrderCancellationEmail(order: Order, reason?: string) {
  const safeCustomerName = escapeHtml(order.customer.name || "Customer");
  const safeOrderNumber = escapeHtml(order.orderNumber);
  const safeReason = escapeHtml(reason || "Order cancellation requested.");
  const wasPaid = order.paymentStatus === "paid" || order.paymentStatus === "succeeded" || order.paymentStatus === "refunded";

  let paymentDetailsHtml = "";
  if (wasPaid && order.refundAmount && order.refundAmount > 0) {
    paymentDetailsHtml = `
      <div style="background: #f3e5f5; border: 1px solid #e1bee7; padding: 14px 18px; border-radius: 6px; margin: 20px 0; font-size: 13.5px; color: #4a148c;">
        <strong>Automatic Refund Initiated:</strong> A full refund of <strong>${formatPrice(order.refundAmount)}</strong> has been processed via Stripe.
        ${order.refundId ? `<div style="font-family: monospace; font-size: 12px; margin-top: 4px;">Stripe Refund ID: ${escapeHtml(order.refundId)}</div>` : ""}
        <p style="margin: 6px 0 0; font-size: 12px; color: #6a1b9a;">
          Note: Funds are returned to your original payment card. Depending on your card issuer, the amount typically reflects on your bank statement in 5–10 business days.
        </p>
      </div>
    `;
  } else {
    paymentDetailsHtml = `
      <div style="background: #f5f5f5; border: 1px solid #e0e0e0; padding: 14px 18px; border-radius: 6px; margin: 20px 0; font-size: 13.5px; color: #424242;">
        <strong>Payment Status:</strong> This order was cancelled before payment was captured. No charge was deducted from your account and no refund is required.
      </div>
    `;
  }

  const subject = `Order Cancellation Notice: #${order.orderNumber} – ${SITE.name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; padding: 28px; color: #1a1a1a; border: 1px solid #e5e5e5; background: #ffffff;">
      ${getEmailBrandHeader(`<p style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #757575; margin-top: 6px;">ORDER CANCELLED</p>`)}

      <p style="font-size: 15px; line-height: 1.6;">Hello ${safeCustomerName},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #444;">
        Your order <strong>#${safeOrderNumber}</strong> has been cancelled.
      </p>

      <div style="background: #fafafa; border: 1px solid #ebebeb; padding: 14px 18px; border-radius: 6px; font-size: 13.5px; margin-bottom: 20px;">
        <div><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</div>
        <div><strong>Reason:</strong> ${safeReason}</div>
        <div><strong>Order Status:</strong> CANCELLED</div>
      </div>

      ${paymentDetailsHtml}

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0 20px;" />
      <p style="font-size: 12px; color: #777; text-align: center;">
        If you have any questions or would like to re-order, please reach out to us on WhatsApp: +${SITE.whatsapp} or email <a href="mailto:${SITE.email}">${SITE.email}</a>.
      </p>
    </div>
  `;

  return sendTrackedNotification({
    orderId: order.id,
    orderNumber: order.orderNumber,
    type: "order_cancellation",
    recipient: order.customer.email,
    subject,
    html,
    idempotencyKey: `notif_order_cancel_${order.id}`,
  });
}

/* ──────────────── 4. REFUND EMAILS (INITIATED, SUCCESS, FAILED) ──────────────── */

export async function sendRefundInitiatedEmail(
  order: Order,
  refundAmount: number,
  isFullRefund: boolean,
  refundId?: string
) {
  const safeCustomerName = escapeHtml(order.customer.name || "Customer");
  const safeOrderNumber = escapeHtml(order.orderNumber);

  const subject = `Refund Initiated for Order #${order.orderNumber} – ${SITE.name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; padding: 28px; color: #1a1a1a; border: 1px solid #e5e5e5; background: #ffffff;">
      ${getEmailBrandHeader(`<p style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #6a1b9a; margin-top: 6px;">REFUND INITIATED</p>`)}

      <p style="font-size: 15px; line-height: 1.6;">Hello ${safeCustomerName},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #444;">
        A ${isFullRefund ? "full" : "partial"} refund of <strong>${formatPrice(refundAmount)}</strong> has been initiated through Stripe for Order <strong>#${safeOrderNumber}</strong>.
      </p>

      <div style="background: #f3e5f5; border: 1px solid #e1bee7; padding: 14px 18px; border-radius: 6px; margin: 20px 0; font-size: 13.5px; color: #4a148c;">
        <div><strong>Refund Amount:</strong> ${formatPrice(refundAmount)}</div>
        <div><strong>Refund Type:</strong> ${isFullRefund ? "Full Refund" : "Partial Refund"}</div>
        ${refundId ? `<div style="font-family: monospace; font-size: 12px; margin-top: 4px;">Stripe Refund Reference: ${escapeHtml(refundId)}</div>` : ""}
      </div>

      <p style="font-size: 13.5px; line-height: 1.6; color: #555;">
        <strong>Important Bank Processing Note:</strong> Although the refund has been submitted to your bank via Stripe, card issuing banks typically take <strong>5 to 10 business days</strong> to post the credit to your statement.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0 20px;" />
      <p style="font-size: 12px; color: #777; text-align: center;">
        ${SITE.name} Boutique · MM Alam Road, Gulberg 2, Lahore · <a href="mailto:${SITE.email}">${SITE.email}</a>
      </p>
    </div>
  `;

  return sendTrackedNotification({
    orderId: order.id,
    orderNumber: order.orderNumber,
    type: "refund_initiated",
    recipient: order.customer.email,
    subject,
    html,
    idempotencyKey: `notif_refund_init_${order.id}_${refundId || refundAmount}`,
  });
}

export async function sendRefundSuccessfulEmail(
  order: Order,
  refundAmount: number,
  isFullRefund: boolean,
  refundId?: string
) {
  const safeCustomerName = escapeHtml(order.customer.name || "Customer");
  const safeOrderNumber = escapeHtml(order.orderNumber);

  const subject = `Refund Confirmed for Order #${order.orderNumber} – ${SITE.name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; padding: 28px; color: #1a1a1a; border: 1px solid #e5e5e5; background: #ffffff;">
      ${getEmailBrandHeader(`<p style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #2e7d32; margin-top: 6px;">REFUND CONFIRMED BY STRIPE</p>`)}

      <p style="font-size: 15px; line-height: 1.6;">Hello ${safeCustomerName},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #444;">
        Stripe has confirmed the ${isFullRefund ? "full" : "partial"} refund of <strong>${formatPrice(refundAmount)}</strong> for Order <strong>#${safeOrderNumber}</strong>.
      </p>

      <div style="background: #e8f5e9; border: 1px solid #c8e6c9; padding: 14px 18px; border-radius: 6px; margin: 20px 0; font-size: 13.5px; color: #1b5e20;">
        <div><strong>Confirmed Refund:</strong> ${formatPrice(refundAmount)}</div>
        ${refundId ? `<div style="font-family: monospace; font-size: 12px; margin-top: 4px;">Refund ID: ${escapeHtml(refundId)}</div>` : ""}
      </div>

      <p style="font-size: 13px; color: #555;">
        The funds have been dispatched to your bank. Please check your credit/debit card account.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0 20px;" />
      <p style="font-size: 12px; color: #777; text-align: center;">
        ${SITE.name} Boutique · <a href="mailto:${SITE.email}">${SITE.email}</a>
      </p>
    </div>
  `;

  return sendTrackedNotification({
    orderId: order.id,
    orderNumber: order.orderNumber,
    type: "refund_successful",
    recipient: order.customer.email,
    subject,
    html,
    idempotencyKey: `notif_refund_success_${order.id}_${refundId || refundAmount}`,
  });
}

export async function sendRefundFailedEmail(order: Order, failureReason?: string) {
  const safeCustomerName = escapeHtml(order.customer.name || "Customer");
  const safeOrderNumber = escapeHtml(order.orderNumber);
  const safeReason = escapeHtml(failureReason || "Card issuer rejected the refund transaction.");

  const subject = `Refund Processing Update: Order #${order.orderNumber} – ${SITE.name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; padding: 28px; color: #1a1a1a; border: 1px solid #e5e5e5; background: #ffffff;">
      ${getEmailBrandHeader(`<p style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #c62828; margin-top: 6px;">REFUND NOTICE</p>`)}

      <p style="font-size: 15px; line-height: 1.6;">Hello ${safeCustomerName},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #444;">
        We encountered an issue while processing your refund for Order <strong>#${safeOrderNumber}</strong>.
      </p>

      <div style="background: #ffebee; border: 1px solid #ffcdd2; padding: 14px 18px; border-radius: 6px; margin: 20px 0; font-size: 13.5px; color: #b71c1c;">
        <strong>Details:</strong> ${safeReason}
      </div>

      <p style="font-size: 13.5px; line-height: 1.6; color: #444;">
        Our concierge team has been automatically alerted to this issue and is reviewing this with Stripe. We will contact you shortly or arrange an alternative direct transfer.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0 20px;" />
      <p style="font-size: 12px; color: #777; text-align: center;">
        ${SITE.name} Boutique · WhatsApp: +${SITE.whatsapp} · <a href="mailto:${SITE.email}">${SITE.email}</a>
      </p>
    </div>
  `;

  return sendTrackedNotification({
    orderId: order.id,
    orderNumber: order.orderNumber,
    type: "refund_failed",
    recipient: order.customer.email,
    subject,
    html,
    idempotencyKey: `notif_refund_fail_${order.id}_${Date.now()}`,
  });
}

/* ──────────────── 5. SHIPPING & TRACKING UPDATE EMAIL ──────────────── */

export async function sendShippingUpdateEmail(order: Order) {
  const safeCustomerName = escapeHtml(order.customer.name || "Customer");
  const safeOrderNumber = escapeHtml(order.orderNumber);
  const safeStatus = escapeHtml(order.status.toUpperCase());
  const safeCourier = escapeHtml(order.courier || "Express Courier");
  const safeTrackingNumber = escapeHtml(order.trackingNumber || "");
  const safeTrackingUrl = order.trackingUrl ? escapeHtml(order.trackingUrl) : "";
  const safeShippingDate = order.shippingDate ? escapeHtml(new Date(order.shippingDate).toLocaleDateString()) : "";
  const safeEstimatedDate = order.estimatedDeliveryDate ? escapeHtml(order.estimatedDeliveryDate) : "";

  let statusDescription = "";
  if (order.status === "processing") {
    statusDescription = "Your bespoke attire is currently in production at our Lahore atelier.";
  } else if (order.status === "shipped") {
    statusDescription = "Your package has been dispatched from our atelier and is in transit.";
  } else if (order.status === "delivered") {
    statusDescription = "Your package has been successfully delivered to your doorstep. We hope you love wearing your Sillhouete creation!";
  } else {
    statusDescription = `Your order status has been updated to ${safeStatus}.`;
  }

  const subject = `Shipping Update: Order #${order.orderNumber} is ${order.status.toUpperCase()} – ${SITE.name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; padding: 28px; color: #1a1a1a; border: 1px solid #e5e5e5; background: #ffffff;">
      ${getEmailBrandHeader(`<p style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #005bd3; margin-top: 6px;">ORDER STATUS UPDATE: ${safeStatus}</p>`)}

      <p style="font-size: 15px; line-height: 1.6;">Hello ${safeCustomerName},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #444;">
        ${statusDescription}
      </p>

      ${
        safeTrackingNumber || safeCourier
          ? `
        <div style="background: #f7f9fc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 6px; margin: 20px 0; font-size: 13.5px; line-height: 1.6;">
          <div><strong>Courier:</strong> ${safeCourier}</div>
          ${safeTrackingNumber ? `<div><strong>Tracking Number:</strong> <code style="font-size: 14px; font-weight: bold; color: #005bd3;">${safeTrackingNumber}</code></div>` : ""}
          ${safeShippingDate ? `<div><strong>Shipping Date:</strong> ${safeShippingDate}</div>` : ""}
          ${safeEstimatedDate ? `<div><strong>Estimated Delivery:</strong> ${safeEstimatedDate}</div>` : ""}
          ${
            safeTrackingUrl
              ? `
            <div style="margin-top: 14px;">
              <a href="${safeTrackingUrl}" target="_blank" rel="noopener noreferrer" style="background: #005bd3; color: #ffffff; text-decoration: none; padding: 10px 20px; font-size: 12.5px; font-weight: bold; border-radius: 4px; display: inline-block;">
                Track Your Shipment Online &rarr;
              </a>
            </div>
          `
              : ""
          }
        </div>
      `
          : ""
      }

      <div style="font-size: 13px; color: #555; margin-top: 16px;">
        <strong>Shipping Address:</strong><br />
        ${escapeHtml(order.shippingAddress.address)}, ${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.country)}
      </div>

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0 20px;" />
      <p style="font-size: 12px; color: #777; text-align: center;">
        Need tracking updates or courier assistance? Message us on WhatsApp: +${SITE.whatsapp} or email <a href="mailto:${SITE.email}">${SITE.email}</a>.
      </p>
    </div>
  `;

  return sendTrackedNotification({
    orderId: order.id,
    orderNumber: order.orderNumber,
    type: "shipping_update",
    recipient: order.customer.email,
    subject,
    html,
    idempotencyKey: `notif_shipping_${order.id}_${order.status}_${order.trackingNumber || ""}_${Date.now()}`,
  });
}

/* ──────────────── 6. ACCOUNT & AUTH EMAILS (PRESERVED) ──────────────── */

export async function sendLoginAlertEmail({
  email,
  name,
  time = new Date().toLocaleString(),
}: {
  email: string;
  name: string;
  time?: string;
}) {
  const safeName = escapeHtml(name || "Customer");
  const safeTime = escapeHtml(time);
  const subject = `Login Notification – ${SITE.name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; border: 1px solid #e5e5e5;">
      ${getSimpleEmailHeader()}
      <p style="font-size: 15px; line-height: 1.6;">Hello ${safeName},</p>
      <p style="font-size: 15px; line-height: 1.6;">
        We noticed a recent sign-in to your ${SITE.name} account on <strong>${safeTime}</strong>.
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
  return sendTrackedNotification({
    type: "login_alert",
    recipient: email,
    subject,
    html,
    idempotencyKey: `notif_login_${email}_${Date.now()}`,
  });
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
  const safeName = escapeHtml(name || "Customer");
  const safeCode = escapeHtml(resetCode);
  const subject = `Password Reset Code – ${SITE.name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; border: 1px solid #e5e5e5;">
      ${getSimpleEmailHeader()}
      <p style="font-size: 15px; line-height: 1.6;">Hello ${safeName},</p>
      <p style="font-size: 15px; line-height: 1.6;">
        We received a request to reset your password. Use the verification code below to set a new password:
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <span style="display: inline-block; padding: 12px 28px; background-color: #111111; color: #ffffff; font-size: 24px; letter-spacing: 6px; font-family: monospace; font-weight: bold;">
          ${safeCode}
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
  return sendTrackedNotification({
    type: "password_reset",
    recipient: email,
    subject,
    html,
    idempotencyKey: `notif_reset_${email}_${Date.now()}`,
  });
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
  const safeName = escapeHtml(name || "Customer");
  const subject = `Your ${SITE.name} Account Profile Has Been Updated`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; border: 1px solid #e5e5e5;">
      ${getSimpleEmailHeader()}
      <p style="font-size: 15px; line-height: 1.6;">Hello ${safeName},</p>
      <p style="font-size: 15px; line-height: 1.6;">
        Your account profile was successfully updated. The following detail(s) were modified:
      </p>
      <ul style="font-size: 14px; line-height: 1.8; color: #333;">
        ${updatedFields.map((f) => `<li><strong>${escapeHtml(f)}</strong></li>`).join("")}
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
  return sendTrackedNotification({
    type: "profile_updated",
    recipient: email,
    subject,
    html,
    idempotencyKey: `notif_profile_${email}_${Date.now()}`,
  });
}

/* ──────────────── 7. CONTACT & INQUIRY NOTIFICATIONS (PRESERVED) ──────────────── */

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
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone || "Not provided");
  const safeSubject = escapeHtml(subject || "General Inquiry");
  const safeMessage = escapeHtml(message);

  // 1. Notify store owner
  const adminSubject = `[Inquiry] ${sanitizeHeader(subject) || "New Customer Message"} from ${sanitizeHeader(name)}`;
  const adminHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
      <h2>New Contact Form Inquiry</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Phone:</strong> ${safePhone}</p>
      <p><strong>Subject:</strong> ${safeSubject}</p>
      <p><strong>Message:</strong></p>
      <div style="background: #f7f7f7; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${safeMessage}</div>
    </div>
  `;
  await sendEmail({ to: SITE.email, subject: adminSubject, html: adminHtml });

  // 2. Auto-reply to customer
  const customerSubject = `We have received your message – ${SITE.name}`;
  const customerHtml = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; border: 1px solid #e5e5e5;">
      ${getSimpleEmailHeader()}
      <p style="font-size: 15px; line-height: 1.6;">Hello ${safeName},</p>
      <p style="font-size: 15px; line-height: 1.6;">
        Thank you for contacting ${SITE.name}. We have received your inquiry regarding <strong>${safeSubject}</strong> and our atelier team will respond to you shortly.
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
  return sendTrackedNotification({
    type: "contact_form",
    recipient: email,
    subject: customerSubject,
    html: customerHtml,
    idempotencyKey: `notif_contact_${email}_${Date.now()}`,
  });
}

/* ──────────────── 8. DISCOUNT CODE EMAIL (PRESERVED) ──────────────── */

export async function sendDiscountCodeEmail({
  email,
  code,
  percent = 5,
}: {
  email: string;
  code: string;
  percent?: number;
}) {
  const safeCode = escapeHtml(code);
  const subject = `Your Exclusive ${percent}% Welcome Discount Code: ${code} – ${SITE.name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a; border: 1px solid #e5e5e5; background: #ffffff;">
      ${getEmailBrandHeader(`<p style="font-size: 13px; color: #888; margin-top: 6px; letter-spacing: 1px;">HAUTE COUTURE &amp; FESTIVE LUXURY</p>`)}

      <p style="font-size: 15px; line-height: 1.6;">Hello,</p>
      <p style="font-size: 15px; line-height: 1.6;">
        Thank you for joining the ${SITE.name} inner circle. As a token of our appreciation, here is your exclusive <strong>${percent}% discount code</strong> for your next purchase of luxury Pakistani designer wear:
      </p>

      <div style="margin: 28px 0; text-align: center;">
        <div style="display: inline-block; background: #f7f7f7; border: 2px dashed #111111; padding: 16px 36px; border-radius: 4px;">
          <span style="font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #111111;">
            ${safeCode}
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

  return sendTrackedNotification({
    type: "discount_code",
    recipient: email,
    subject,
    html,
    idempotencyKey: `notif_discount_${email}_${code}`,
  });
}
