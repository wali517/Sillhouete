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

/** Robust converter to generate human-readable plain text fallback from HTML */
export function htmlToPlainText(html: string = ""): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "$2 ($1)")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, "  |  ")
    .replace(/<\/th>/gi, "  |  ")
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n\n$1\n\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n")
    .replace(/<hr[^>]*>/gi, "\n----------------------------------------\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

/* ──────────────── NODEMAILER TRANSPORTER ──────────────── */

interface TransporterContext {
  transporter: Transporter;
  user: string;
  from: string;
  host: string;
  port: number;
  pass: string;
  isGmail: boolean;
}

export async function getTransporter(): Promise<TransporterContext | null> {
  let host = process.env.SMTP_HOST || "smtp.gmail.com";
  let port = Number(process.env.SMTP_PORT) || 465;
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;
  let customFrom = process.env.SMTP_FROM;

  // Always check MongoDB SiteSettings so any updates in Admin Settings take effect immediately!
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

  if (host && user && pass) {
    const cleanPass = pass.replace(/\s+/g, "");
    const cleanUser = user.trim();
    const isPort465 = Number(port) === 465;
    const isGmail = host === "smtp.gmail.com" || host.includes("gmail") || cleanUser.endsWith("@gmail.com");

    // For Gmail accounts, nodemailer's built-in service provides optimal connection pooling,
    // avoiding port 465 firewall timeouts and packet drops.
    const transporter = isGmail
      ? nodemailer.createTransport({
          service: "gmail",
          auth: { user: cleanUser, pass: cleanPass },
        })
      : nodemailer.createTransport({
          host,
          port: Number(port),
          secure: isPort465,
          auth: { user: cleanUser, pass: cleanPass },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 8000,
          greetingTimeout: 6000,
          socketTimeout: 12000,
        });

    // CRITICAL SPF/DKIM ALIGNMENT:
    // When sending via Gmail SMTP, From address MUST match authenticated user (e.g. saleemalbala18@gmail.com).
    // If From uses a different unverified domain, Gmail/Yahoo/Outlook mark SPF/DMARC as FAIL -> Lands in SPAM!
    let from = `"SILLHOUETE" <${cleanUser}>`;
    if (!isGmail && customFrom) {
      from = customFrom;
    }

    return { transporter, user: cleanUser, from, host, port: Number(port), pass: cleanPass, isGmail };
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

/* ──────────────── CANONICAL EMAIL HTML WRAPPER (ANTI-SPAM CERTIFIED) ──────────────── */

function buildFullEmailHtml({
  preheader,
  innerHtml,
}: {
  preheader: string;
  innerHtml: string;
}): string {
  const safePreheader = escapeHtml(preheader);
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${SITE.name}</title>
</head>
<body style="margin: 0; padding: 0; width: 100% !important; background-color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Hidden Preheader for Inbox Snippets -->
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #f7f7f7; opacity: 0; mso-hide: all;">
    ${safePreheader} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7f7f7; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #ffffff; border: 1px solid #e7e7e7; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <tr>
            <td style="padding: 32px 28px;">
              ${innerHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; border-top: 1px solid #ebebeb; padding: 22px 24px; text-align: center; font-size: 11.5px; line-height: 1.6; color: #777777;">
              <p style="margin: 0 0 6px; font-weight: 600; color: #444444; letter-spacing: 1px; text-transform: uppercase;">
                ${SITE.name} Atelier &amp; Luxury Pret
              </p>
              <p style="margin: 0 0 8px;">
                Almas Tower, MM Alam Road, Gulberg 2, Lahore, Pakistan<br />
                Concierge WhatsApp: +${SITE.whatsapp} &bull; Support: <a href="mailto:${SITE.email}" style="color: #111111; text-decoration: underline;">${SITE.email}</a>
              </p>
              <p style="margin: 0; font-size: 10.5px; color: #999999;">
                This is an official transactional message regarding your order or account with Sillhouete.<br />
                &copy; ${new Date().getFullYear()} ${SITE.name}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ──────────────── SEND EMAIL WITH ANTI-SPAM HEADERS ──────────────── */

export async function sendEmail({
  to,
  subject,
  html,
  text,
  preheader,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  preheader?: string;
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

  const { transporter, from, user: authUser, host, isGmail } = context;

  // Build clean plain text fallback to prevent MIME_HTML_ONLY spam penalty
  const plainTextContent = text ? text.trim() : htmlToPlainText(html);

  // Wrap HTML inside full canonical HTML layout with preheader and CAN-SPAM physical address footer
  const fullHtml = html.includes("<html")
    ? html
    : buildFullEmailHtml({
        preheader: preheader || cleanSubject,
        innerHtml: html,
      });

  const domain = isGmail
    ? "gmail.com"
    : host.includes(".")
    ? host.split(".").slice(-2).join(".")
    : "sillhouete.com";

  const messageId = `<sil-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@${domain}>`;

  // Standard Anti-Spam Headers conforming to RFC 5322, RFC 3834, and 2024 Google/Yahoo guidelines
  const mailHeaders: Record<string, string> = {
    "Message-ID": messageId,
    Date: new Date().toUTCString(),
    "Auto-Submitted": "auto-generated",
    "X-Auto-Response-Suppress": "All",
    Precedence: "bulk",
    "List-Unsubscribe": `<mailto:${SITE.email}?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    "X-Mailer": "Sillhouete E-Commerce Concierge Engine",
    "X-Entity-Ref-ID": `order-msg-${Date.now()}`,
  };

  try {
    const info = await transporter.sendMail({
      from,
      replyTo: "info@sillhouete.com",
      to: cleanTo,
      subject: cleanSubject,
      text: plainTextContent,
      html: fullHtml,
      envelope: {
        from: authUser,
        to: cleanTo,
      },
      headers: mailHeaders,
    });

    console.log(`📧 [EMAIL DELIVERED] To: ${cleanTo} | Subject: ${cleanSubject} | ID: ${info.messageId}`);
    return {
      success: true,
      status: "sent",
      messageId: info.messageId,
    };
  } catch (primaryError: unknown) {
    console.warn("📧 [EMAIL RETRY] Primary attempt failed or timed out. Switching transport...", primaryError);

    try {
      const altPort = context.port === 465 ? 587 : 465;
      const altTransporter = nodemailer.createTransport({
        host: context.host,
        port: altPort,
        secure: altPort === 465,
        auth: { user: context.user, pass: context.pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 8000,
        greetingTimeout: 6000,
        socketTimeout: 12000,
      });

      const altInfo = await altTransporter.sendMail({
        from: context.from,
        replyTo: "info@sillhouete.com",
        to: cleanTo,
        subject: cleanSubject,
        text: plainTextContent,
        html: fullHtml,
        envelope: {
          from: authUser,
          to: cleanTo,
        },
        headers: mailHeaders,
      });

      console.log(`📧 [EMAIL DELIVERED ON RETRY] To: ${cleanTo} via port ${altPort} | ID: ${altInfo.messageId}`);
      return {
        success: true,
        status: "sent",
        messageId: altInfo.messageId,
      };
    } catch (retryError: unknown) {
      const errMsg = retryError instanceof Error ? retryError.message : "SMTP transport failure";
      console.error("📧 [EMAIL SEND ERROR - ALL ATTEMPTS FAILED]:", errMsg);
      return {
        success: false,
        status: "failed",
        error: errMsg,
      };
    }
  }
}

/* ──────────────── TRACKED NOTIFICATION WITH OUTBOX & IDEMPOTENCY ──────────────── */

export async function sendTrackedNotification({
  orderId,
  orderNumber,
  type,
  recipient,
  subject,
  html,
  text,
  preheader,
  idempotencyKey,
}: {
  orderId?: string;
  orderNumber?: string;
  type: NotificationType;
  recipient: string;
  subject: string;
  html: string;
  text?: string;
  preheader?: string;
  idempotencyKey: string;
}): Promise<SendEmailResult & { notificationId?: string }> {
  try {
    await connectDB();

    // 1. Check idempotency: skip if already successfully sent
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

    // 2. Dispatch email with plain text and anti-spam protection
    const result = await sendEmail({ to: recipient, subject, html, text, preheader });

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
          text: text || htmlToPlainText(html),
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
    const fallback = await sendEmail({ to: recipient, subject, html, text, preheader });
    return fallback;
  }
}

/* ──────────────── BRANDED EMAIL LOGO HEADER HELPER ──────────────── */

function getEmailBrandHeader(badgeHtml = ""): string {
  return `
    <div style="text-align: center; margin-bottom: 24px; padding-bottom: 18px; border-bottom: 1px solid #f0f0f0;">
      <a href="https://sillhouete.com" target="_blank" style="display: inline-block; text-decoration: none;">
        <img src="${SITE.logo}" alt="${SITE.name}" style="height: 42px; width: auto; max-width: 180px; margin: 0 auto 8px; display: block; border: 0;" />
      </a>
      <h1 style="font-size: 22px; font-weight: normal; letter-spacing: 3px; text-transform: uppercase; margin: 0; color: #111111; font-family: Georgia, serif;">
        ${SITE.name}
      </h1>
      ${badgeHtml}
    </div>
  `;
}

function getSimpleEmailHeader(): string {
  return `
    <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f0f0f0;">
      <a href="https://sillhouete.com" target="_blank" style="display: inline-block; text-decoration: none;">
        <img src="${SITE.logo}" alt="${SITE.name}" style="height: 38px; width: auto; max-width: 160px; margin: 0 auto 6px; display: block; border: 0;" />
      </a>
      <div style="font-size: 19px; font-weight: normal; letter-spacing: 2.5px; text-transform: uppercase; color: #111111; font-family: Georgia, serif;">
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

  let paymentHeaderBadge = "Order Confirmed";
  let paymentNoticeHtml = "";
  let paymentPlainNote = "";

  if (isStripe) {
    const cardBrand = order.paymentDetails?.brand ? escapeHtml(order.paymentDetails.brand.toUpperCase()) : "CARD";
    const last4 = order.paymentDetails?.last4 ? escapeHtml(order.paymentDetails.last4) : "****";
    paymentHeaderBadge = "Payment Verified &amp; Confirmed";
    paymentNoticeHtml = `
      <div style="background: #e8f5e9; border: 1px solid #c8e6c9; padding: 14px 18px; border-radius: 4px; margin-bottom: 20px; font-size: 13.5px; color: #2e7d32; line-height: 1.5;">
        <strong>✓ Payment Verified:</strong> Your card payment of <strong>${formatPrice(order.total)}</strong> (${cardBrand} &bull;&bull;&bull;&bull; ${last4}) has been successfully processed and verified.
      </div>
    `;
    paymentPlainNote = `Payment Verified by Stripe: ${cardBrand} **** ${last4} (${formatPrice(order.total)})`;
  } else if (isCod || order.paymentMethod === "cod") {
    paymentHeaderBadge = "Cash on Delivery Order Placed";
    paymentNoticeHtml = `
      <div style="background: #fff8e1; border: 1px solid #ffe082; padding: 14px 18px; border-radius: 4px; margin-bottom: 20px; font-size: 13.5px; color: #7c6000; line-height: 1.5;">
        <strong>Cash on Delivery:</strong> Please have <strong>${formatPrice(order.total)}</strong> ready in cash upon delivery at your doorstep.
      </div>
    `;
    paymentPlainNote = `Payment Method: Cash on Delivery (${formatPrice(order.total)} to be paid at delivery)`;
  } else if (isBank) {
    paymentHeaderBadge = "Bank Transfer Order Reserved";
    paymentNoticeHtml = `
      <div style="background: #fff8e1; border: 1px solid #ffe082; padding: 14px 18px; border-radius: 4px; margin-bottom: 20px; font-size: 13.5px; color: #7c6000; line-height: 1.5;">
        <strong>Bank Deposit Action Required:</strong> Please transfer <strong>${formatPrice(order.total)}</strong> to:
        <div style="margin-top: 6px; font-family: monospace; font-size: 13px;">
          Bank: <strong>Meezan Bank</strong> | Title: <strong>SILLHOUETE</strong><br />
          IBAN: <strong>PK80MEZN0002160109517881</strong>
        </div>
        Please WhatsApp your payment screenshot to +${SITE.whatsapp} to confirm dispatch.
      </div>
    `;
    paymentPlainNote = `Bank Transfer Required: Meezan Bank | Title: SILLHOUETE | IBAN: PK80MEZN0002160109517881\nPlease WhatsApp receipt to +${SITE.whatsapp}`;
  }

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
          <div style="font-weight: 600; font-size: 13.5px; color: #111111;">${escapeHtml(item.title)}</div>
          <div style="font-size: 12px; color: #666666; margin-top: 3px;">
            Size: ${escapeHtml(item.size)}
            ${item.customSizeNote ? `<br/><span style="color: #6b21a8; font-size: 11.5px; font-weight: 500;">Custom: ${escapeHtml(item.customSizeNote)}</span>` : ""}
            ${item.dupatta ? ` | Sleeves: ${escapeHtml(item.dupatta)}` : ""}
            ${item.adOn ? ` | ${escapeHtml(item.adOn)}` : ""}
          </div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 13.5px; color: #444444;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-size: 13.5px; font-weight: 600; color: #111111;">
          ${formatPrice(item.price * item.quantity)}
        </td>
      </tr>
    `
    )
    .join("");

  const subject = `Order Confirmation #${order.orderNumber} – ${SITE.name}`;
  const preheader = `Thank you for your order #${order.orderNumber}. We have received your order and our atelier is preparing it.`;

  const html = `
    ${getEmailBrandHeader(`<p style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #555555; margin-top: 6px;">${paymentHeaderBadge}</p>`)}

    <p style="font-size: 15px; line-height: 1.6; color: #111111;">Hello ${safeCustomerName},</p>
    <p style="font-size: 14.5px; line-height: 1.6; color: #444444;">
      Thank you for shopping with ${SITE.name}. Your order has been placed and is being prepared with artisanal care by our Lahore atelier.
    </p>

    ${paymentNoticeHtml}

    <div style="background: #fafafa; border: 1px solid #eaeaea; padding: 16px 18px; border-radius: 4px; margin-bottom: 24px; font-size: 13px; line-height: 1.7; color: #333333;">
      <div><strong>Order Number:</strong> #${safeOrderNumber}</div>
      <div><strong>Payment Method:</strong> ${escapeHtml(order.paymentMethod.toUpperCase())}</div>
      <div><strong>Order Status:</strong> ${escapeHtml(order.status.toUpperCase())}</div>
      <div><strong>Shipping Destination:</strong> ${escapeHtml(order.shippingAddress.address)}, ${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.country)}</div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="border-bottom: 1px solid #dddddd; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666666;">
          <th style="padding-bottom: 8px;">Item</th>
          <th style="padding-bottom: 8px; text-align: center;">Qty</th>
          <th style="padding-bottom: 8px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="text-align: right; font-size: 13.5px; line-height: 1.8; color: #333333;">
      <div>Subtotal: <strong>${formatPrice(order.subtotal)}</strong></div>
      ${order.discount ? `<div>Discount: <strong>-${formatPrice(order.discount)}</strong></div>` : ""}
      <div>Shipping: <strong>${order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</strong></div>
      <div style="font-size: 17px; border-top: 1px solid #e0e0e0; padding-top: 8px; margin-top: 8px; color: #111111;">
        Total: <strong>${formatPrice(order.total)}</strong>
      </div>
    </div>

    <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid #f0f0f0; text-align: center; font-size: 12.5px; color: #666666;">
      Need assistance with measurements or customization? Reach our concierge on WhatsApp: <strong>+${SITE.whatsapp}</strong> or email <a href="mailto:${SITE.email}" style="color: #111111;">${SITE.email}</a>.
    </div>
  `;

  const plainItems = order.items
    .map(
      (item) =>
        `- ${item.title} (Size: ${item.size}) x${item.quantity} = ${formatPrice(item.price * item.quantity)}`
    )
    .join("\n");

  const plainText = `SILLHOUETE – ORDER CONFIRMATION
Order #${order.orderNumber}

Hello ${order.customer.name || "Customer"},

Thank you for choosing Sillhouete. Your order has been placed successfully and is being prepared with artisanal care by our Lahore atelier.

${paymentPlainNote ? paymentPlainNote + "\n\n" : ""}ORDER DETAILS:
Order Number: #${order.orderNumber}
Payment Method: ${order.paymentMethod.toUpperCase()}
Order Status: ${order.status.toUpperCase()}
Shipping Address: ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.country}

ITEMS:
${plainItems}

Subtotal: ${formatPrice(order.subtotal)}
${order.discount ? `Discount: -${formatPrice(order.discount)}\n` : ""}Shipping: ${order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}
TOTAL: ${formatPrice(order.total)}

Need assistance with sizing or bespoke tailoring?
WhatsApp Concierge: +${SITE.whatsapp}
Email: ${SITE.email}

Sillhouete Atelier · Almas Tower, MM Alam Road, Gulberg 2, Lahore, Pakistan`;

  return sendTrackedNotification({
    orderId: order.id,
    orderNumber: order.orderNumber,
    type: "order_confirmation",
    recipient: order.customer.email,
    subject,
    preheader,
    html,
    text: plainText,
    idempotencyKey: `notif_order_confirm_${order.id}`,
  });
}

/* ──────────────── 2. PAYMENT FAILURE EMAIL ──────────────── */

export async function sendPaymentFailureEmail(order: Order, failureReason?: string) {
  const safeCustomerName = escapeHtml(order.customer.name || "Customer");
  const safeOrderNumber = escapeHtml(order.orderNumber);
  const safeReason = escapeHtml(failureReason || "Your card could not be authorized by your card issuer.");

  const subject = `Payment Notice for Order #${order.orderNumber} – ${SITE.name}`;
  const preheader = `We were unable to process payment for Order #${order.orderNumber}. Your card has not been charged.`;

  const html = `
    ${getEmailBrandHeader(`<p style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #b71c1c; margin-top: 6px;">Payment Notice</p>`)}

    <p style="font-size: 15px; line-height: 1.6; color: #111111;">Hello ${safeCustomerName},</p>
    <p style="font-size: 14.5px; line-height: 1.6; color: #444444;">
      We were unable to process your payment for Order <strong>#${safeOrderNumber}</strong>. Please note that your card has <strong>not</strong> been charged.
    </p>

    <div style="background: #ffebee; border: 1px solid #ffcdd2; padding: 14px 18px; border-radius: 4px; margin: 20px 0; font-size: 13.5px; color: #b71c1c; line-height: 1.5;">
      <strong>Details:</strong> ${safeReason}
    </div>

    <p style="font-size: 13.5px; line-height: 1.6; color: #555555;">
      This may occur due to international transaction limits, card authentication requirements, or daily limits set by your issuing bank.
    </p>

    <div style="text-align: center; margin: 26px 0;">
      <a href="https://sillhouete.com/checkout" style="background: #111111; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 12px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; display: inline-block; border-radius: 2px;">
        Retry Checkout
      </a>
    </div>

    <p style="font-size: 12.5px; color: #666666; text-align: center;">
      Alternatively, message our concierge on WhatsApp at +${SITE.whatsapp} for bank transfer details or assistance.
    </p>
  `;

  const plainText = `SILLHOUETE – PAYMENT NOTICE
Order #${order.orderNumber}

Hello ${order.customer.name || "Customer"},

We were unable to process payment for Order #${order.orderNumber}. Your card has NOT been charged.

Reason: ${failureReason || "Your card could not be authorized by your card issuer."}

You can retry your purchase on our website:
https://sillhouete.com/checkout

Or message our WhatsApp concierge for direct assistance: +${SITE.whatsapp}

Sillhouete Atelier · Lahore, Pakistan`;

  return sendTrackedNotification({
    orderId: order.id,
    orderNumber: order.orderNumber,
    type: "payment_failure",
    recipient: order.customer.email,
    subject,
    preheader,
    html,
    text: plainText,
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
  let paymentDetailsPlain = "";

  if (wasPaid && order.refundAmount && order.refundAmount > 0) {
    paymentDetailsHtml = `
      <div style="background: #f3e5f5; border: 1px solid #e1bee7; padding: 14px 18px; border-radius: 4px; margin: 20px 0; font-size: 13.5px; color: #4a148c; line-height: 1.5;">
        <strong>Refund Initiated:</strong> A refund of <strong>${formatPrice(order.refundAmount)}</strong> has been processed via Stripe.
        ${order.refundId ? `<div style="font-family: monospace; font-size: 12px; margin-top: 4px;">Refund Reference: ${escapeHtml(order.refundId)}</div>` : ""}
        <p style="margin: 6px 0 0; font-size: 12px; color: #6a1b9a;">
          Funds will reflect on your card statement within 5–10 business days depending on your bank.
        </p>
      </div>
    `;
    paymentDetailsPlain = `Refund Initiated: ${formatPrice(order.refundAmount)} via Stripe. Expected on card in 5–10 business days.`;
  } else {
    paymentDetailsHtml = `
      <div style="background: #f5f5f5; border: 1px solid #e0e0e0; padding: 14px 18px; border-radius: 4px; margin: 20px 0; font-size: 13px; color: #424242;">
        <strong>Payment Status:</strong> This order was cancelled before payment was captured. No charge was deducted.
      </div>
    `;
    paymentDetailsPlain = `Payment Status: Order cancelled before capture. No charge was deducted.`;
  }

  const subject = `Order Cancellation Notice: #${order.orderNumber} – ${SITE.name}`;
  const preheader = `Your order #${order.orderNumber} with Sillhouete has been cancelled.`;

  const html = `
    ${getEmailBrandHeader(`<p style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #616161; margin-top: 6px;">Order Cancelled</p>`)}

    <p style="font-size: 15px; line-height: 1.6; color: #111111;">Hello ${safeCustomerName},</p>
    <p style="font-size: 14.5px; line-height: 1.6; color: #444444;">
      Your order <strong>#${safeOrderNumber}</strong> has been cancelled.
    </p>

    <div style="background: #fafafa; border: 1px solid #ebebeb; padding: 14px 18px; border-radius: 4px; font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
      <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
      <div><strong>Reason:</strong> ${safeReason}</div>
      <div><strong>Status:</strong> CANCELLED</div>
    </div>

    ${paymentDetailsHtml}

    <p style="font-size: 12.5px; color: #666666; text-align: center; margin-top: 24px;">
      If you have questions or wish to re-order, message us on WhatsApp: +${SITE.whatsapp} or email <a href="mailto:${SITE.email}" style="color: #111111;">${SITE.email}</a>.
    </p>
  `;

  const plainText = `SILLHOUETE – ORDER CANCELLATION
Order #${order.orderNumber}

Hello ${order.customer.name || "Customer"},

Your order #${order.orderNumber} has been cancelled.
Reason: ${reason || "Order cancellation requested."}

${paymentDetailsPlain}

If you have questions, please contact our concierge:
WhatsApp: +${SITE.whatsapp}
Email: ${SITE.email}

Sillhouete Atelier · Lahore, Pakistan`;

  return sendTrackedNotification({
    orderId: order.id,
    orderNumber: order.orderNumber,
    type: "order_cancellation",
    recipient: order.customer.email,
    subject,
    preheader,
    html,
    text: plainText,
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

  const subject = `Refund Processed for Order #${order.orderNumber} – ${SITE.name}`;
  const preheader = `A ${isFullRefund ? "full" : "partial"} refund of ${formatPrice(refundAmount)} has been initiated for Order #${order.orderNumber}.`;

  const html = `
    ${getEmailBrandHeader(`<p style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #4a148c; margin-top: 6px;">Refund Processed</p>`)}

    <p style="font-size: 15px; line-height: 1.6; color: #111111;">Hello ${safeCustomerName},</p>
    <p style="font-size: 14.5px; line-height: 1.6; color: #444444;">
      A ${isFullRefund ? "full" : "partial"} refund of <strong>${formatPrice(refundAmount)}</strong> has been initiated through Stripe for Order <strong>#${safeOrderNumber}</strong>.
    </p>

    <div style="background: #f3e5f5; border: 1px solid #e1bee7; padding: 14px 18px; border-radius: 4px; margin: 20px 0; font-size: 13.5px; color: #4a148c; line-height: 1.6;">
      <div><strong>Refund Amount:</strong> ${formatPrice(refundAmount)}</div>
      <div><strong>Type:</strong> ${isFullRefund ? "Full Refund" : "Partial Refund"}</div>
      ${refundId ? `<div style="font-family: monospace; font-size: 12px; margin-top: 4px;">Reference ID: ${escapeHtml(refundId)}</div>` : ""}
    </div>

    <p style="font-size: 13px; line-height: 1.6; color: #555555;">
      <strong>Bank Posting Time:</strong> The refund has been submitted via Stripe. Depending on your card issuing bank, the credit typically appears on your statement in <strong>5 to 10 business days</strong>.
    </p>
  `;

  const plainText = `SILLHOUETE – REFUND NOTIFICATION
Order #${order.orderNumber}

Hello ${order.customer.name || "Customer"},

A ${isFullRefund ? "full" : "partial"} refund of ${formatPrice(refundAmount)} has been initiated via Stripe for Order #${order.orderNumber}.
${refundId ? `Reference ID: ${refundId}\n` : ""}
Bank Posting: Card issuing banks typically take 5 to 10 business days to credit your statement.

Questions? WhatsApp Concierge: +${SITE.whatsapp} | Email: ${SITE.email}

Sillhouete Atelier · Lahore, Pakistan`;

  return sendTrackedNotification({
    orderId: order.id,
    orderNumber: order.orderNumber,
    type: "refund_initiated",
    recipient: order.customer.email,
    subject,
    preheader,
    html,
    text: plainText,
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

  const subject = `Refund Confirmed: Order #${order.orderNumber} – ${SITE.name}`;
  const preheader = `Your refund of ${formatPrice(refundAmount)} for Order #${order.orderNumber} has been confirmed.`;

  const html = `
    ${getEmailBrandHeader(`<p style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #2e7d32; margin-top: 6px;">Refund Confirmed</p>`)}

    <p style="font-size: 15px; line-height: 1.6; color: #111111;">Hello ${safeCustomerName},</p>
    <p style="font-size: 14.5px; line-height: 1.6; color: #444444;">
      Your ${isFullRefund ? "full" : "partial"} refund of <strong>${formatPrice(refundAmount)}</strong> for Order <strong>#${safeOrderNumber}</strong> has been confirmed.
    </p>

    <div style="background: #e8f5e9; border: 1px solid #c8e6c9; padding: 14px 18px; border-radius: 4px; margin: 20px 0; font-size: 13.5px; color: #1b5e20; line-height: 1.6;">
      <div><strong>Confirmed Refund:</strong> ${formatPrice(refundAmount)}</div>
      ${refundId ? `<div style="font-family: monospace; font-size: 12px; margin-top: 4px;">Refund ID: ${escapeHtml(refundId)}</div>` : ""}
    </div>

    <p style="font-size: 13px; color: #555555;">
      The funds have been returned to your original payment card.
    </p>
  `;

  const plainText = `SILLHOUETE – REFUND CONFIRMED
Order #${order.orderNumber}

Hello ${order.customer.name || "Customer"},

Your ${isFullRefund ? "full" : "partial"} refund of ${formatPrice(refundAmount)} for Order #${order.orderNumber} has been confirmed.
${refundId ? `Refund ID: ${refundId}\n` : ""}
Funds have been returned to your payment card.

Sillhouete Atelier · Lahore, Pakistan`;

  return sendTrackedNotification({
    orderId: order.id,
    orderNumber: order.orderNumber,
    type: "refund_successful",
    recipient: order.customer.email,
    subject,
    preheader,
    html,
    text: plainText,
    idempotencyKey: `notif_refund_success_${order.id}_${refundId || refundAmount}`,
  });
}

export async function sendRefundFailedEmail(order: Order, failureReason?: string) {
  const safeCustomerName = escapeHtml(order.customer.name || "Customer");
  const safeOrderNumber = escapeHtml(order.orderNumber);
  const safeReason = escapeHtml(failureReason || "Card issuer rejected the refund transaction.");

  const subject = `Refund Notice: Order #${order.orderNumber} – ${SITE.name}`;
  const preheader = `We encountered an issue processing your refund for Order #${order.orderNumber}.`;

  const html = `
    ${getEmailBrandHeader(`<p style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #c62828; margin-top: 6px;">Refund Update</p>`)}

    <p style="font-size: 15px; line-height: 1.6; color: #111111;">Hello ${safeCustomerName},</p>
    <p style="font-size: 14.5px; line-height: 1.6; color: #444444;">
      We encountered an issue processing your refund for Order <strong>#${safeOrderNumber}</strong>.
    </p>

    <div style="background: #ffebee; border: 1px solid #ffcdd2; padding: 14px 18px; border-radius: 4px; margin: 20px 0; font-size: 13.5px; color: #b71c1c; line-height: 1.6;">
      <strong>Details:</strong> ${safeReason}
    </div>

    <p style="font-size: 13.5px; line-height: 1.6; color: #444444;">
      Our concierge team has been automatically alerted and will arrange an alternative direct transfer or contact you shortly.
    </p>
  `;

  const plainText = `SILLHOUETE – REFUND UPDATE
Order #${order.orderNumber}

Hello ${order.customer.name || "Customer"},

We encountered an issue processing your refund for Order #${order.orderNumber}.
Details: ${failureReason || "Card issuer rejected the refund transaction."}

Our concierge team is reviewing this and will contact you directly to arrange an alternative transfer.

WhatsApp Concierge: +${SITE.whatsapp}
Email: ${SITE.email}`;

  return sendTrackedNotification({
    orderId: order.id,
    orderNumber: order.orderNumber,
    type: "refund_failed",
    recipient: order.customer.email,
    subject,
    preheader,
    html,
    text: plainText,
    idempotencyKey: `notif_refund_fail_${order.id}_${Date.now()}`,
  });
}

/* ──────────────── 5. SHIPPING & TRACKING UPDATE EMAIL ──────────────── */

export async function sendShippingUpdateEmail(order: Order) {
  const safeCustomerName = escapeHtml(order.customer.name || "Customer");
  const safeOrderNumber = escapeHtml(order.orderNumber);
  const statusLower = (order.status || "").toLowerCase();
  const safeCourier = escapeHtml(order.courier || "Express Courier");
  const safeTrackingNumber = escapeHtml(order.trackingNumber || "");
  const safeTrackingUrl = order.trackingUrl ? escapeHtml(order.trackingUrl) : "";
  const safeShippingDate = order.shippingDate ? escapeHtml(new Date(order.shippingDate).toLocaleDateString()) : "";
  const safeEstimatedDate = order.estimatedDeliveryDate ? escapeHtml(order.estimatedDeliveryDate) : "";

  let statusTitle = "Order Update";
  let statusDescription = "";

  if (statusLower === "processing") {
    statusTitle = "In Production";
    statusDescription = "Your bespoke attire is currently being hand-crafted at our Lahore atelier.";
  } else if (statusLower === "shipped") {
    statusTitle = "Order Dispatched";
    statusDescription = "Your package has been dispatched from our atelier and is in transit.";
  } else if (statusLower === "delivered") {
    statusTitle = "Delivered";
    statusDescription = "Your package has been delivered to your doorstep. We hope you cherish wearing your Sillhouete ensemble!";
  } else {
    statusTitle = order.status.toUpperCase();
    statusDescription = `Your order status has been updated to ${order.status.toUpperCase()}.`;
  }

  const subject = `Shipment Update: Order #${order.orderNumber} (${statusTitle}) – ${SITE.name}`;
  const preheader = `Your order #${order.orderNumber} status is now: ${statusTitle}. ${safeTrackingNumber ? `Tracking: ${safeTrackingNumber}` : ""}`;

  const html = `
    ${getEmailBrandHeader(`<p style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #005bd3; margin-top: 6px;">${escapeHtml(statusTitle)}</p>`)}

    <p style="font-size: 15px; line-height: 1.6; color: #111111;">Hello ${safeCustomerName},</p>
    <p style="font-size: 14.5px; line-height: 1.6; color: #444444;">
      ${statusDescription}
    </p>

    ${
      safeTrackingNumber || safeCourier
        ? `
      <div style="background: #f7f9fc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 4px; margin: 20px 0; font-size: 13.5px; line-height: 1.7; color: #333333;">
        <div><strong>Courier:</strong> ${safeCourier}</div>
        ${safeTrackingNumber ? `<div><strong>Tracking Number:</strong> <code style="font-size: 13.5px; font-weight: bold; color: #005bd3;">${safeTrackingNumber}</code></div>` : ""}
        ${safeShippingDate ? `<div><strong>Shipping Date:</strong> ${safeShippingDate}</div>` : ""}
        ${safeEstimatedDate ? `<div><strong>Estimated Delivery:</strong> ${safeEstimatedDate}</div>` : ""}
        ${
          safeTrackingUrl
            ? `
          <div style="margin-top: 14px;">
            <a href="${safeTrackingUrl}" target="_blank" rel="noopener noreferrer" style="background: #111111; color: #ffffff; text-decoration: none; padding: 10px 20px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; border-radius: 2px; display: inline-block;">
              Track Shipment Online &rarr;
            </a>
          </div>
        `
            : ""
        }
      </div>
    `
        : ""
    }

    <div style="font-size: 13px; color: #555555; margin-top: 16px; line-height: 1.6;">
      <strong>Shipping Address:</strong><br />
      ${escapeHtml(order.shippingAddress.address)}, ${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.country)}
    </div>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0; text-align: center; font-size: 12.5px; color: #666666;">
      Need courier assistance? WhatsApp Concierge: <strong>+${SITE.whatsapp}</strong> or email <a href="mailto:${SITE.email}" style="color: #111111;">${SITE.email}</a>.
    </div>
  `;

  const plainText = `SILLHOUETE – SHIPMENT UPDATE
Order #${order.orderNumber}
Status: ${statusTitle}

Hello ${order.customer.name || "Customer"},

${statusDescription}

${safeCourier ? `Courier: ${order.courier}\n` : ""}${safeTrackingNumber ? `Tracking Number: ${order.trackingNumber}\n` : ""}${safeTrackingUrl ? `Track Online: ${order.trackingUrl}\n` : ""}${safeEstimatedDate ? `Estimated Delivery: ${order.estimatedDeliveryDate}\n` : ""}
Shipping Destination:
${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.country}

Assistance: WhatsApp +${SITE.whatsapp} | Email ${SITE.email}

Sillhouete Atelier · Lahore, Pakistan`;

  return sendTrackedNotification({
    orderId: order.id,
    orderNumber: order.orderNumber,
    type: "shipping_update",
    recipient: order.customer.email,
    subject,
    preheader,
    html,
    text: plainText,
    idempotencyKey: `notif_shipping_${order.id}_${order.status}_${order.trackingNumber || ""}_${Date.now()}`,
  });
}

/* ──────────────── 6. ACCOUNT & AUTH EMAILS ──────────────── */

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
  const preheader = `A recent sign-in to your ${SITE.name} account was noticed on ${time}.`;

  const html = `
    ${getSimpleEmailHeader()}
    <p style="font-size: 15px; line-height: 1.6; color: #111111;">Hello ${safeName},</p>
    <p style="font-size: 14.5px; line-height: 1.6; color: #444444;">
      We noticed a sign-in to your ${SITE.name} account on <strong>${safeTime}</strong>.
    </p>
    <p style="font-size: 13.5px; line-height: 1.6; color: #666666;">
      If this was you, no action is needed. If you did not sign in, please reset your password immediately or contact our concierge.
    </p>
  `;

  const plainText = `SILLHOUETE – LOGIN NOTIFICATION

Hello ${name || "Customer"},

A sign-in to your Sillhouete account was recorded on ${time}.
If this was you, no action is needed. If you did not sign in, please reset your password immediately on sillhouete.com.

Sillhouete Atelier · Lahore, Pakistan`;

  return sendTrackedNotification({
    type: "login_alert",
    recipient: email,
    subject,
    preheader,
    html,
    text: plainText,
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
  const subject = `Your Password Reset Code: ${resetCode} – ${SITE.name}`;
  const preheader = `Your verification code is ${resetCode}. Use this code to reset your Sillhouete password.`;

  const html = `
    ${getSimpleEmailHeader()}
    <p style="font-size: 15px; line-height: 1.6; color: #111111;">Hello ${safeName},</p>
    <p style="font-size: 14.5px; line-height: 1.6; color: #444444;">
      We received a request to reset your password. Use the verification code below to set a new password:
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <span style="display: inline-block; padding: 12px 28px; background-color: #111111; color: #ffffff; font-size: 24px; letter-spacing: 6px; font-family: monospace; font-weight: bold; border-radius: 4px;">
        ${safeCode}
      </span>
    </div>
    <p style="font-size: 13px; line-height: 1.6; color: #666666;">
      This code is valid for 15 minutes. If you did not request this, you can safely ignore this email.
    </p>
  `;

  const plainText = `SILLHOUETE – PASSWORD RESET CODE

Hello ${name || "Customer"},

Your verification code is: ${resetCode}

This code is valid for 15 minutes. If you did not request this, please disregard this email.

Sillhouete Atelier · Lahore, Pakistan`;

  return sendTrackedNotification({
    type: "password_reset",
    recipient: email,
    subject,
    preheader,
    html,
    text: plainText,
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
  const subject = `Your Account Profile Has Been Updated – ${SITE.name}`;
  const preheader = `Your ${SITE.name} account details were successfully updated.`;

  const html = `
    ${getSimpleEmailHeader()}
    <p style="font-size: 15px; line-height: 1.6; color: #111111;">Hello ${safeName},</p>
    <p style="font-size: 14.5px; line-height: 1.6; color: #444444;">
      Your account profile was successfully updated. Modified detail(s):
    </p>
    <ul style="font-size: 13.5px; line-height: 1.8; color: #333333;">
      ${updatedFields.map((f) => `<li><strong>${escapeHtml(f)}</strong></li>`).join("")}
    </ul>
    <p style="font-size: 13px; color: #666666; margin-top: 20px;">
      If you did not authorize these changes, please reach out immediately at <a href="mailto:${SITE.email}" style="color: #111111;">${SITE.email}</a>.
    </p>
  `;

  const plainText = `SILLHOUETE – ACCOUNT PROFILE UPDATED

Hello ${name || "Customer"},

Your account profile details were updated:
${updatedFields.map((f) => `- ${f}`).join("\n")}

If you did not make these changes, contact us immediately: ${SITE.email}

Sillhouete Atelier · Lahore, Pakistan`;

  return sendTrackedNotification({
    type: "profile_updated",
    recipient: email,
    subject,
    preheader,
    html,
    text: plainText,
    idempotencyKey: `notif_profile_${email}_${Date.now()}`,
  });
}

/* ──────────────── 7. CONTACT & INQUIRY NOTIFICATIONS ──────────────── */

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
  const adminSubject = `Customer Inquiry: ${sanitizeHeader(subject) || "New Message"} from ${sanitizeHeader(name)}`;
  const adminHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
      <h2 style="margin-top: 0;">New Customer Message</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Phone:</strong> ${safePhone}</p>
      <p><strong>Subject:</strong> ${safeSubject}</p>
      <p><strong>Message:</strong></p>
      <div style="background: #f7f7f7; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${safeMessage}</div>
    </div>
  `;
  await sendEmail({
    to: SITE.email,
    subject: adminSubject,
    html: adminHtml,
    preheader: `New inquiry from ${name}: ${subject || "General Inquiry"}`,
  });

  // 2. Auto-reply to customer
  const customerSubject = `We have received your message – ${SITE.name}`;
  const preheader = `Thank you for contacting Sillhouete. Our concierge team has received your message and will respond shortly.`;

  const customerHtml = `
    ${getSimpleEmailHeader()}
    <p style="font-size: 15px; line-height: 1.6; color: #111111;">Hello ${safeName},</p>
    <p style="font-size: 14.5px; line-height: 1.6; color: #444444;">
      Thank you for contacting ${SITE.name}. We have received your inquiry regarding <strong>${safeSubject}</strong> and our atelier team will respond to you shortly.
    </p>
    <p style="font-size: 13.5px; line-height: 1.6; color: #666666;">
      For urgent bridal or bespoke consultations, you can also message us directly on WhatsApp at <strong>+${SITE.whatsapp}</strong>.
    </p>
  `;

  const plainText = `SILLHOUETE – MESSAGE RECEIVED

Hello ${name},

Thank you for reaching out to Sillhouete. We have received your inquiry regarding "${subject || "General Inquiry"}" and our atelier concierge will reply to you shortly.

WhatsApp Concierge: +${SITE.whatsapp}
Email: ${SITE.email}

Sillhouete Atelier · Lahore, Pakistan`;

  return sendTrackedNotification({
    type: "contact_form",
    recipient: email,
    subject: customerSubject,
    preheader,
    html: customerHtml,
    text: plainText,
    idempotencyKey: `notif_contact_${email}_${Date.now()}`,
  });
}

/* ──────────────── 8. DISCOUNT VOUCHER EMAIL (AUTOMATIC INBOX DISPATCH) ──────────────── */

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
  const subject = `Your Exclusive ${percent}% Welcome Voucher: ${code} – ${SITE.name}`;
  const preheader = `Use voucher code ${code} to enjoy ${percent}% off your next order of luxury designer wear at Sillhouete.`;

  const html = `
    ${getEmailBrandHeader(`<p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #666666; margin-top: 6px;">Haute Couture &bull; Festive Luxury</p>`)}

    <p style="font-size: 15px; line-height: 1.6; color: #111111;">Hello,</p>
    <p style="font-size: 14.5px; line-height: 1.6; color: #444444;">
      Thank you for subscribing to ${SITE.name}. Here is your exclusive <strong>${percent}% discount voucher code</strong> for your next purchase of luxury Pakistani designer wear:
    </p>

    <div style="margin: 26px 0; text-align: center;">
      <div style="display: inline-block; background: #fafafa; border: 2px dashed #111111; padding: 18px 38px; border-radius: 4px;">
        <span style="font-family: monospace; font-size: 26px; font-weight: bold; letter-spacing: 4px; color: #111111;">
          ${safeCode}
        </span>
      </div>
      <p style="font-size: 12.5px; color: #666666; margin-top: 10px;">
        Enter code <strong>${safeCode}</strong> at checkout to apply your <strong>${percent}% discount</strong>.
      </p>
    </div>

    <div style="text-align: center; margin: 26px 0;">
      <a href="https://sillhouete.com/collections/new-arrivals" style="background: #111111; color: #ffffff; text-decoration: none; padding: 13px 32px; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; display: inline-block; border-radius: 2px;">
        Shop New Arrivals
      </a>
    </div>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0; text-align: center; font-size: 12px; color: #777777;">
      Worldwide Express Delivery Available &bull; Bespoke Tailoring &bull; Atelier Lahore
    </div>
  `;

  const plainText = `SILLHOUETE – YOUR EXCLUSIVE WELCOME DISCOUNT VOUCHER

Hello,

Thank you for subscribing to Sillhouete. As a welcome gift, here is your exclusive ${percent}% discount voucher code:

VOUCHER CODE: ${code}
DISCOUNT: ${percent}% off your entire order

To redeem, enter ${code} at checkout on sillhouete.com.

Shop online: https://sillhouete.com/collections/new-arrivals

Need styling guidance or custom measurements?
WhatsApp Concierge: +${SITE.whatsapp}
Email: ${SITE.email}

Sillhouete Atelier · Almas Tower, MM Alam Road, Gulberg 2, Lahore, Pakistan`;

  // Use timestamp in idempotencyKey so when a customer enters their email,
  // the email is immediately dispatched every time (not skipped due to an old cached attempt)
  return sendTrackedNotification({
    type: "discount_code",
    recipient: email,
    subject,
    preheader,
    html,
    text: plainText,
    idempotencyKey: `notif_discount_${email}_${Date.now()}`,
  });
}

/* ──────────────── 9. SUPPORT REPLY EMAIL ──────────────── */

export async function sendCustomerReplyEmail({
  to,
  customerName = "Valued Customer",
  subject,
  replyText,
  originalMessage,
}: {
  to: string;
  customerName?: string;
  subject: string;
  replyText: string;
  originalMessage?: string;
}) {
  const safeName = escapeHtml(customerName);
  const safeReply = escapeHtml(replyText).replace(/\n/g, "<br />");
  const cleanSubject = sanitizeHeader(subject || `Response from ${SITE.name} Support`);
  const preheader = `A response to your inquiry from the ${SITE.name} Concierge team.`;

  const html = `
    ${getEmailBrandHeader(`<p style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #666666; margin-top: 6px;">Client Concierge &amp; Support</p>`)}

    <p style="font-size: 15px; line-height: 1.6; color: #111111;">Dear ${safeName},</p>
    
    <div style="margin: 20px 0; padding: 18px 20px; background: #fafafa; border-left: 3px solid #111111; font-size: 14.5px; line-height: 1.7; color: #222222;">
      ${safeReply}
    </div>

    ${
      originalMessage
        ? `
      <div style="margin: 24px 0; padding: 14px 16px; background: #fdfdfd; border-radius: 4px; border: 1px solid #eeeeee;">
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #777777; margin: 0 0 6px 0; font-weight: 600;">In reference to your message:</p>
        <p style="font-size: 13px; color: #555555; line-height: 1.5; margin: 0; font-style: italic;">"${escapeHtml(originalMessage)}"</p>
      </div>
    `
        : ""
    }

    <p style="font-size: 13.5px; line-height: 1.6; color: #555555; margin-top: 24px;">
      If you require further assistance, feel free to reply directly to this email or reach us on WhatsApp at +${SITE.whatsapp}.
    </p>
  `;

  const plainText = `SILLHOUETE – CLIENT CONCIERGE

Dear ${customerName},

${replyText}

${originalMessage ? `\n--- In reference to your message ---\n"${originalMessage}"\n` : ""}
If you have any further questions, simply reply to this email or message our WhatsApp concierge at +${SITE.whatsapp}.

Sillhouete Atelier · Lahore, Pakistan`;

  return sendTrackedNotification({
    type: "support_reply",
    recipient: to,
    subject: cleanSubject,
    preheader,
    html,
    text: plainText,
    idempotencyKey: `notif_reply_${to}_${Date.now()}`,
  });
}
