import connectDB from "./mongodb";
import { ProductModel } from "./models/Product";
import { OrderModel } from "./models/Order";
import { CustomerModel } from "./models/Customer";
import { ContactMessageModel } from "./models/ContactMessage";
import { BlogPostModel } from "./models/BlogPost";
import { SiteSettingsModel } from "./models/SiteSettings";
import { allProducts as initialProducts } from "@/data/products";
import { SEED_BLOGS } from "@/data/seed-blogs";
import { ANNOUNCEMENTS, SITE } from "@/data/site";
import {
  sendOrderConfirmationEmail,
  sendPaymentFailureEmail,
  sendOrderCancellationEmail,
  sendRefundInitiatedEmail,
  sendRefundSuccessfulEmail,
  sendRefundFailedEmail,
  sendShippingUpdateEmail,
  sendContactFormNotification,
} from "./email";
import { getStripeServer, toStripeAmount, fromStripeAmount } from "./stripe";
import type {
  Product,
  Order,
  Customer,
  ContactMessage,
  BlogPost,
  SiteSettings,
  OrderStatus,
  PaymentStatus,
} from "@/types";

/* ──────────────── SERIALIZATION HELPERS ──────────────── */

function toPlain<T>(doc: unknown): T | undefined {
  if (!doc) return undefined;
  const obj = JSON.parse(JSON.stringify(doc));
  if (!obj.id && obj._id) obj.id = String(obj._id);
  delete obj._id;
  delete obj.__v;
  return obj as T;
}

function toPlainArray<T>(docs: unknown[]): T[] {
  return (docs || []).map((d) => toPlain<T>(d)!).filter(Boolean);
}

/* ──────────────── PRODUCTS ──────────────── */

function enrichInitialProducts(prods: typeof initialProducts): Product[] {
  return prods.map((p) => ({
    ...p,
    category: p.category || (p.handle.includes("rm") || p.handle.includes("formal") ? "Formal" : "Luxury Pret"),
    description:
      p.description ||
      `${p.alt}. Crafted from premium fabrics with bespoke hand embroidery, fine zardozi detailing, and artisanal tailoring. Perfect for festive ceremonies, weddings, and formal celebrations.`,
    inStock: p.inStock ?? true,
    sizes: p.sizes || ["XS", "S", "M", "L", "XL"],
    images: p.images && p.images.length ? p.images : [p.image, p.hoverImage].filter(Boolean),
    sku: p.sku || `SLH-${p.handle.toUpperCase()}`,
  }));
}

export async function getProducts(): Promise<Product[]> {
  try {
    await connectDB();
    const docs = await ProductModel.find({}).sort({ createdAt: -1 }).lean();
    if (docs && docs.length > 0) {
      return toPlainArray<Product>(docs);
    }
  } catch (err) {
    console.warn("MongoDB getProducts fallback:", err);
  }
  return enrichInitialProducts(initialProducts);
}

/** Search products by title, handle, alt text, category, or description. */
export async function searchProducts(query: string): Promise<Product[]> {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  const products = await getProducts();
  return products.filter((product) =>
    [
      product.title,
      product.handle,
      product.alt,
      product.category,
      product.description,
    ].some((value) => value?.toLowerCase().includes(term)),
  );
}

export async function getProductByHandle(handle: string): Promise<Product | undefined> {
  try {
    await connectDB();
    const doc = await ProductModel.findOne({ handle }).lean();
    const prod = toPlain<Product>(doc);
    if (prod) return prod;
  } catch (err) {
    console.warn("MongoDB getProductByHandle fallback:", err);
  }
  const enriched = enrichInitialProducts(initialProducts);
  return enriched.find((p) => p.handle === handle);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    await connectDB();
    const doc = await ProductModel.findOne({ $or: [{ id }, { handle: id }] }).lean();
    const prod = toPlain<Product>(doc);
    if (prod) return prod;
  } catch (err) {
    console.warn("MongoDB getProductById fallback:", err);
  }
  const enriched = enrichInitialProducts(initialProducts);
  return enriched.find((p) => p.id === id || p.handle === id);
}

export async function saveProduct(product: Partial<Product> & { title: string; price: number }): Promise<Product> {
  const handle =
    product.handle ||
    product.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const id = product.id || `prod-${Date.now()}`;

  const fullProduct: Product = {
    id,
    handle,
    title: product.title,
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
    priceFrom: !!product.priceFrom,
    image: product.image || "https://sillhouete.com/cdn/shop/files/sillhouete_logo_1.png",
    hoverImage: product.hoverImage || product.image || "https://sillhouete.com/cdn/shop/files/sillhouete_logo_1.png",
    images: product.images && product.images.length ? product.images : [product.image || "", product.hoverImage || ""].filter(Boolean),
    alt: product.alt || product.title,
    ratio: product.ratio || 1.5,
    isNew: product.isNew ?? true,
    category: product.category || "Luxury Pret",
    description: product.description || `${product.title} luxury designer dress.`,
    inStock: product.inStock ?? true,
    sizes: product.sizes && product.sizes.length ? product.sizes : ["XS", "S", "M", "L", "XL"],
    fabric: product.fabric || "Pure Silk / Chiffon",
    sku: product.sku || `SLH-${handle.toUpperCase()}`,
    dupattaOptions: product.dupattaOptions,
    adOnOptions: product.adOnOptions,
    variants: product.variants,
  };

  try {
    await connectDB();
    await ProductModel.findOneAndUpdate(
      { $or: [{ id }, { handle }] },
      { $set: fullProduct },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.warn("MongoDB saveProduct fallback:", err);
  }

  return fullProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await connectDB();
    const res = await ProductModel.deleteOne({ $or: [{ id }, { handle: id }] });
    return res.deletedCount > 0;
  } catch (err) {
    console.warn("MongoDB deleteProduct error:", err);
    return false;
  }
}

/* ──────────────── ORDER VALIDATION & PRICING ──────────────── */

export interface CartInputItem {
  id?: string;
  handle?: string;
  size?: string;
  quantity?: number;
  dupatta?: string;
  adOn?: string;
}

export interface ValidatedCartCalculation {
  items: Array<{
    id: string;
    handle: string;
    title: string;
    price: number;
    size: string;
    quantity: number;
    image: string;
    dupatta?: string;
    adOn?: string;
  }>;
  subtotal: number;
  shipping: number;
  discount: number;
  discountCode?: string;
  total: number;
  currency: string;
}

/**
 * Server-side trusted calculation of order total, prices, stock, and discounts.
 * NEVER trusts frontend prices, subtotals, discounts, shipping fees, or totals.
 */
export async function validateAndCalculateOrder(
  rawItems: CartInputItem[],
  discountCodeInput?: string
): Promise<ValidatedCartCalculation> {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error("Cart must contain at least one item.");
  }

  const settings = await getSettings();
  const validatedItems: ValidatedCartCalculation["items"] = [];
  let subtotal = 0;

  for (const item of rawItems) {
    const lookupId = item.id || item.handle;
    if (!lookupId) {
      throw new Error("Invalid cart item: missing product identifier.");
    }

    const product = (await getProductById(lookupId)) || (await getProductByHandle(lookupId));
    if (!product) {
      throw new Error(`Product not found or no longer available: ${lookupId}`);
    }

    if (product.inStock === false) {
      throw new Error(`Item "${product.title}" is currently out of stock.`);
    }

    const quantity = Math.max(1, Math.min(50, Math.floor(Number(item.quantity) || 1)));
    const size = (item.size || "M").trim();

    // Check size validity if defined on product
    if (product.sizes && product.sizes.length > 0 && !product.sizes.includes(size)) {
      // Allow custom size only if size customization is allowed
      const isCustomAllowed = product.customization?.sizeCustomization?.toLowerCase().includes("yes");
      if (!isCustomAllowed && !product.sizes.includes(size)) {
        throw new Error(`Selected size "${size}" is not available for "${product.title}".`);
      }
    }

    // Always fetch trusted price from database / product record
    const trustedUnitPrice = Number(product.price);
    if (isNaN(trustedUnitPrice) || trustedUnitPrice <= 0) {
      throw new Error(`Invalid catalog price for item "${product.title}".`);
    }

    subtotal += trustedUnitPrice * quantity;

    validatedItems.push({
      id: product.id,
      handle: product.handle,
      title: product.title,
      price: trustedUnitPrice,
      size,
      quantity,
      image: product.image || product.images?.[0] || "",
      dupatta: item.dupatta,
      adOn: item.adOn,
    });
  }

  // Validate discount code against server-stored active codes
  let discount = 0;
  let validCode: string | undefined = undefined;

  if (discountCodeInput && discountCodeInput.trim()) {
    const code = discountCodeInput.trim().toUpperCase();
    let discountPercent = 0;

    const availableCodes = settings.discountCodes || [
      { code: "WELCOME5", percent: 5, active: true },
      { code: "EID2026", percent: 10, active: true },
    ];

    const match = availableCodes.find((c) => c.code.toUpperCase() === code && c.active);
    if (match) {
      discountPercent = match.percent;
      validCode = match.code;
    } else if (code === "WELCOME5") {
      discountPercent = 5;
      validCode = "WELCOME5";
    } else if (code === "EID2026") {
      discountPercent = 10;
      validCode = "EID2026";
    }

    if (discountPercent > 0) {
      discount = Math.round((subtotal * discountPercent) / 100);
    }
  }

  // Calculate shipping charges server-side
  const freeThreshold = Number(settings.freeShippingThreshold) || 140000;
  const standardFee = Number(settings.standardShippingFee) || 250;
  const shipping = subtotal >= freeThreshold ? 0 : standardFee;

  const total = Math.max(0, subtotal - discount + shipping);

  return {
    items: validatedItems,
    subtotal,
    shipping,
    discount,
    discountCode: validCode,
    total,
    currency: "PKR",
  };
}

/* ──────────────── ORDERS ──────────────── */

export async function getOrders(): Promise<Order[]> {
  await connectDB();
  const docs = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
  return toPlainArray<Order>(docs);
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  await connectDB();
  const doc = await OrderModel.findOne({ $or: [{ id }, { orderNumber: id }] }).lean();
  return toPlain<Order>(doc);
}

export async function getOrderByStripeSessionId(sessionId: string): Promise<Order | undefined> {
  await connectDB();
  const doc = await OrderModel.findOne({ stripeSessionId: sessionId }).lean();
  return toPlain<Order>(doc);
}

export async function getOrderByStripePaymentIntentId(piId: string): Promise<Order | undefined> {
  await connectDB();
  const doc = await OrderModel.findOne({ stripePaymentIntentId: piId }).lean();
  return toPlain<Order>(doc);
}

export async function createOrder(
  data: Omit<Order, "id" | "orderNumber" | "createdAt">,
): Promise<Order> {
  const id = `ord-${Date.now()}`;
  const orderNumber = `SLH-${Math.floor(10000 + Math.random() * 90000)}`;
  const newOrder: Order = {
    ...data,
    id,
    orderNumber,
    createdAt: new Date().toISOString(),
  };

  await connectDB();
  await OrderModel.create(newOrder);
  await recordCustomerFromOrder(newOrder);

  // For card / Stripe orders, NEVER send confirmation email at creation (order is unpaid/pending).
  // Confirmation emails for card orders are triggered strictly when payment is verified by the Stripe webhook.
  if (
    newOrder.paymentMethod === "bank_transfer" ||
    newOrder.paymentMethod === "bank_deposit" ||
    newOrder.paymentMethod === "cod"
  ) {
    sendOrderConfirmationEmail(newOrder, newOrder.paymentMethod === "cod").catch((err) =>
      console.warn("[Email Notification Error] Order confirmation dispatch:", err)
    );
  }

  return newOrder;
}

export async function recordOrderStripeSession(orderId: string, stripeSessionId: string): Promise<Order | null> {
  await connectDB();
  const doc = await OrderModel.findOneAndUpdate(
    { $or: [{ id: orderId }, { orderNumber: orderId }] },
    { $set: { stripeSessionId } },
    { new: true }
  ).lean();
  return toPlain<Order>(doc) || null;
}

export async function recordOrderPaymentAttempt(orderId: string, paymentIntentId: string): Promise<void> {
  await connectDB();
  const now = new Date().toISOString();
  await OrderModel.findOneAndUpdate(
    { $or: [{ id: orderId }, { orderNumber: orderId }] },
    {
      $set: { stripePaymentIntentId: paymentIntentId },
      $push: {
        paymentTimeline: {
          title: "Payment Intent Created",
          date: now,
          details: `Stripe PaymentIntent ${paymentIntentId} created for verified order amount.`,
        },
      },
    }
  );
}

export async function markOrderPaidByStripe(params: {
  orderId?: string;
  sessionId?: string;
  paymentIntentId?: string;
  customerId?: string;
  amountPaid: number;
  currency: string;
  eventId?: string;
  paymentDetails?: {
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    funding?: string;
  };
}): Promise<Order | null> {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (params.orderId) {
    query.$or = [{ id: params.orderId }, { orderNumber: params.orderId }];
  } else if (params.sessionId) {
    query.stripeSessionId = params.sessionId;
  } else if (params.paymentIntentId) {
    query.stripePaymentIntentId = params.paymentIntentId;
  } else {
    throw new Error("markOrderPaidByStripe requires orderId, sessionId, or paymentIntentId");
  }

  const existing = await OrderModel.findOne(query);
  if (!existing) {
    return null;
  }

  const alreadyPaid = existing.paymentStatus === "paid" || existing.paymentStatus === "succeeded";

  existing.paymentStatus = "paid";
  if (existing.status === "pending") {
    existing.status = "processing";
  }
  if (params.sessionId) existing.stripeSessionId = params.sessionId;
  if (params.paymentIntentId) existing.stripePaymentIntentId = params.paymentIntentId;
  if (params.customerId) existing.stripeCustomerId = params.customerId;
  if (params.amountPaid) existing.amountPaid = params.amountPaid;
  existing.paidAt = new Date();
  if (params.paymentDetails) existing.paymentDetails = params.paymentDetails;
  if (params.eventId) {
    existing.stripeEventIds = existing.stripeEventIds || [];
    if (!existing.stripeEventIds.includes(params.eventId)) {
      existing.stripeEventIds.push(params.eventId);
    }
  }

  existing.paymentTimeline = existing.paymentTimeline || [];
  existing.paymentTimeline.push({
    title: "Payment Succeeded & Verified",
    date: new Date().toISOString(),
    details: `Stripe verified payment of Rs. ${params.amountPaid.toLocaleString()} (${params.currency.toUpperCase()}). Card: ${
      params.paymentDetails?.brand ? params.paymentDetails.brand.toUpperCase() : "Card"
    } •••• ${params.paymentDetails?.last4 || "****"}.`,
  });

  await existing.save();
  const plain = toPlain<Order>(existing.toObject())!;

  // Send confirmation email upon first verified successful payment
  if (!alreadyPaid) {
    sendOrderConfirmationEmail(plain).catch((err) =>
      console.warn("Nodemailer payment confirmation email notice:", err)
    );
  }

  return plain;
}

export async function markOrderPaymentFailed(params: {
  orderId?: string;
  paymentIntentId?: string;
  reason: string;
  eventId?: string;
}): Promise<Order | null> {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (params.orderId) query.$or = [{ id: params.orderId }, { orderNumber: params.orderId }];
  else if (params.paymentIntentId) query.stripePaymentIntentId = params.paymentIntentId;
  else return null;

  const order = await OrderModel.findOne(query);
  if (!order) return null;

  order.paymentStatus = "failed";
  order.failureReason = params.reason;
  order.paymentTimeline = order.paymentTimeline || [];
  order.paymentTimeline.push({
    title: "Payment Failed / Declined",
    date: new Date().toISOString(),
    details: params.reason,
  });

  if (params.eventId) {
    order.stripeEventIds = order.stripeEventIds || [];
    if (!order.stripeEventIds.includes(params.eventId)) {
      order.stripeEventIds.push(params.eventId);
    }
  }

  await order.save();
  const plain = toPlain<Order>(order.toObject()) || null;
  if (plain) {
    sendPaymentFailureEmail(plain, params.reason).catch((err) =>
      console.warn("[Email Notification Error] Payment failure notice:", err)
    );
  }
  return plain;
}

export async function cancelOrderAndProcessRefund(params: {
  orderId: string;
  reason?: string;
  cancelledBy?: string;
}): Promise<Order | null> {
  await connectDB();
  const order = await OrderModel.findOne({
    $or: [{ id: params.orderId }, { orderNumber: params.orderId }],
  });
  if (!order) return null;

  const now = new Date();
  const isoNow = now.toISOString();
  const reasonText = params.reason || `Cancelled by ${params.cancelledBy || "admin"}`;

  order.cancellationReason = reasonText;
  order.cancelledAt = now;
  order.status = "cancelled";

  // Scenario B: Order is PAID -> Process automatic refund via Stripe
  if (order.paymentStatus === "paid" || order.paymentStatus === "succeeded") {
    const totalPaid = Number(order.amountPaid || order.total || 0);
    const alreadyRefunded = Number(order.refundAmount || 0);
    const refundableAmount = Math.max(0, totalPaid - alreadyRefunded);

    if (refundableAmount > 0 && order.stripePaymentIntentId) {
      try {
        const stripe = getStripeServer();
        const currency = (order.currency || "PKR").toLowerCase();
        const stripeUnitAmount = toStripeAmount(refundableAmount, currency);

        // Safe idempotency key to prevent duplicate refunds
        const idempotencyKey = `refund_auto_${order.id}_${Math.round(refundableAmount * 100)}`;

        const refund = await stripe.refunds.create(
          {
            payment_intent: order.stripePaymentIntentId,
            amount: stripeUnitAmount,
            reason: "requested_by_customer",
          },
          { idempotencyKey }
        );

        order.refundAmount = alreadyRefunded + refundableAmount;
        order.refundId = refund.id;
        order.refundedAt = now;
        order.refundStatus = "refunded";
        order.paymentStatus = "refunded";

        order.refundTimeline = order.refundTimeline || [];
        order.refundTimeline.push({
          title: "Automatic Refund Initiated",
          date: isoNow,
          details: `Automatic full refund of Rs. ${refundableAmount.toLocaleString()} initiated via Stripe (Refund ID: ${
            refund.id
          }). Note: Funds will reflect in customer's bank account in 5-10 business days.`,
          amount: refundableAmount,
          refundId: refund.id,
        });
      } catch (refundErr: unknown) {
        const errMsg = refundErr instanceof Error ? refundErr.message : "Stripe refund creation failed";
        console.error(`[Auto-Refund Error for Order ${order.id}]:`, errMsg);
        order.refundStatus = "refund_failed";
        order.refundFailureReason = errMsg;
        order.refundTimeline = order.refundTimeline || [];
        order.refundTimeline.push({
          title: "Automatic Refund Failed",
          date: isoNow,
          details: `Automatic refund could not be completed by Stripe: ${errMsg}. An authorized administrator can review and retry.`,
          amount: refundableAmount,
        });
      }
    } else {
      order.refundStatus = alreadyRefunded > 0 ? "refunded" : "none";
    }
  } else {
    // Scenario A: Order cancelled before payment
    if (order.stripePaymentIntentId) {
      try {
        const stripe = getStripeServer();
        const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
        if (
          pi.status === "requires_payment_method" ||
          pi.status === "requires_confirmation" ||
          pi.status === "requires_action" ||
          pi.status === "requires_capture"
        ) {
          await stripe.paymentIntents.cancel(order.stripePaymentIntentId, {
            cancellation_reason: "requested_by_customer",
          });
        }
      } catch (cancelErr) {
        console.warn("[PaymentIntent Cancel Warning]:", cancelErr);
      }
    }

    order.paymentStatus = "cancelled";
    order.paymentTimeline = order.paymentTimeline || [];
    order.paymentTimeline.push({
      title: "Order & Payment Cancelled",
      date: isoNow,
      details: "Order cancelled before payment completion. No refund required.",
    });
  }

  await order.save();
  const plain = toPlain<Order>(order.toObject()) || null;
  if (plain) {
    sendOrderCancellationEmail(plain, reasonText).catch((err) =>
      console.warn("[Email Notification Error] Order cancellation notice:", err)
    );
    if (order.refundAmount && order.refundAmount > 0) {
      sendRefundInitiatedEmail(plain, order.refundAmount, true, order.refundId).catch((err) =>
        console.warn("[Email Notification Error] Refund initiated notice:", err)
      );
    }
  }
  return plain;
}

export async function processPartialRefund(params: {
  orderId: string;
  amount: number;
  reason?: string;
  initiatedBy?: string;
}): Promise<Order | null> {
  await connectDB();
  const order = await OrderModel.findOne({
    $or: [{ id: params.orderId }, { orderNumber: params.orderId }],
  });
  if (!order) throw new Error("Order not found.");

  if (!order.stripePaymentIntentId) {
    throw new Error("No Stripe PaymentIntent associated with this order.");
  }

  const totalPaid = Number(order.amountPaid || order.total || 0);
  const alreadyRefunded = Number(order.refundAmount || 0);
  const remainingRefundable = Math.max(0, totalPaid - alreadyRefunded);

  if (params.amount <= 0) {
    throw new Error("Refund amount must be greater than zero.");
  }

  if (params.amount > remainingRefundable) {
    throw new Error(
      `Cannot refund Rs. ${params.amount}. Maximum remaining refundable amount is Rs. ${remainingRefundable}.`
    );
  }

  const now = new Date();
  const isoNow = now.toISOString();
  const stripe = getStripeServer();
  const currency = (order.currency || "PKR").toLowerCase();
  const stripeUnitAmount = toStripeAmount(params.amount, currency);

  const idempotencyKey = `refund_part_${order.id}_${Math.round(params.amount * 100)}_${Date.now()}`;

  const refund = await stripe.refunds.create(
    {
      payment_intent: order.stripePaymentIntentId,
      amount: stripeUnitAmount,
      reason: "requested_by_customer",
    },
    { idempotencyKey }
  );

  const newTotalRefunded = alreadyRefunded + params.amount;
  const isFull = newTotalRefunded >= totalPaid;

  order.refundAmount = newTotalRefunded;
  order.refundId = refund.id;
  order.refundedAt = now;
  order.refundStatus = isFull ? "refunded" : "partially_refunded";
  order.paymentStatus = isFull ? "refunded" : "partially_refunded";

  order.refundTimeline = order.refundTimeline || [];
  order.refundTimeline.push({
    title: isFull ? "Full Refund Completed" : "Partial Refund Issued",
    date: isoNow,
    details: `${isFull ? "Full" : "Partial"} refund of Rs. ${params.amount.toLocaleString()} processed via Stripe (Refund ID: ${
      refund.id
    }). Reason: ${params.reason || "Customer request"}.`,
    amount: params.amount,
    refundId: refund.id,
  });

  await order.save();
  const plain = toPlain<Order>(order.toObject()) || null;
  if (plain) {
    sendRefundInitiatedEmail(plain, params.amount, isFull, refund.id).catch((err) =>
      console.warn("[Email Notification Error] Partial refund notice:", err)
    );
  }
  return plain;
}

export async function recordOrderRefund(params: {
  orderId?: string;
  paymentIntentId?: string;
  refundId: string;
  refundAmount: number;
  isFullRefund: boolean;
  eventId?: string;
}): Promise<Order | null> {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (params.orderId) {
    query.$or = [{ id: params.orderId }, { orderNumber: params.orderId }];
  } else if (params.paymentIntentId) {
    query.stripePaymentIntentId = params.paymentIntentId;
  } else {
    throw new Error("recordOrderRefund requires orderId or paymentIntentId");
  }

  const order = await OrderModel.findOne(query);
  if (!order) return null;

  order.refundId = params.refundId;
  order.refundAmount = (order.refundAmount || 0) + params.refundAmount;
  order.refundStatus = params.isFullRefund ? "refunded" : "partially_refunded";
  order.paymentStatus = params.isFullRefund ? "refunded" : "partially_refunded";
  order.refundedAt = new Date();

  order.refundTimeline = order.refundTimeline || [];
  order.refundTimeline.push({
    title: params.isFullRefund ? "Full Refund Verified via Webhook" : "Partial Refund Verified via Webhook",
    date: new Date().toISOString(),
    details: `Stripe webhook confirmed refund of Rs. ${params.refundAmount.toLocaleString()} (Refund ID: ${
      params.refundId
    }).`,
    amount: params.refundAmount,
    refundId: params.refundId,
  });

  if (params.eventId) {
    order.stripeEventIds = order.stripeEventIds || [];
    if (!order.stripeEventIds.includes(params.eventId)) {
      order.stripeEventIds.push(params.eventId);
    }
  }

  await order.save();
  const plain = toPlain<Order>(order.toObject()) || null;
  if (plain) {
    sendRefundSuccessfulEmail(plain, params.refundAmount, params.isFullRefund, params.refundId).catch((err) =>
      console.warn("[Email Notification Error] Refund confirmation notice:", err)
    );
  }
  return plain;
}

export async function deleteOrder(id: string): Promise<boolean> {
  try {
    await connectDB();
    const res = await OrderModel.deleteOne({ $or: [{ id }, { orderNumber: id }] });
    return res.deletedCount > 0;
  } catch (err) {
    console.warn("MongoDB deleteOrder error:", err);
    return false;
  }
}

export async function updateOrderStatus(
  id: string,
  updates: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    trackingNumber?: string;
    courier?: string;
    trackingUrl?: string;
    shippingDate?: Date;
    estimatedDeliveryDate?: string;
  },
): Promise<Order | null> {
  // If order is transitioning to cancelled, execute complete automatic cancellation & refund logic!
  if (updates.status === "cancelled") {
    return cancelOrderAndProcessRefund({ orderId: id, reason: "Order cancelled by administrator" });
  }

  try {
    await connectDB();
    const doc = await OrderModel.findOneAndUpdate(
      { $or: [{ id }, { orderNumber: id }] },
      { $set: updates },
      { new: true }
    ).lean();
    if (doc) {
      const plainOrder = toPlain<Order>(doc)!;
      // Send shipping / tracking update email via nodemailer
      if (updates.status || updates.trackingNumber || updates.trackingUrl) {
        sendShippingUpdateEmail(plainOrder).catch((err) =>
          console.warn("[Email Notification Error] Shipping update notice:", err)
        );
      }
      return plainOrder;
    }
  } catch (err) {
    console.warn("MongoDB updateOrderStatus error:", err);
  }
  return null;
}

/* ──────────────── CUSTOMERS ──────────────── */

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Ayesha Khan",
    email: "ayesha.khan@example.com",
    phone: "+92 300 1234567",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    ordersCount: 1,
    totalSpent: 44900,
  },
  {
    id: "cust-2",
    name: "Fatima Zahra",
    email: "fatima.z@example.com",
    phone: "+92 321 9876543",
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    ordersCount: 1,
    totalSpent: 33150,
  },
];

export async function getCustomers(): Promise<Customer[]> {
  try {
    await connectDB();
    const docs = await CustomerModel.find({}).sort({ createdAt: -1 }).lean();
    if (docs && docs.length > 0) {
      return toPlainArray<Customer>(docs);
    }
  } catch (err) {
    console.warn("MongoDB getCustomers fallback:", err);
  }
  return INITIAL_CUSTOMERS;
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  try {
    await connectDB();
    const doc = await CustomerModel.findOne({ id }).lean();
    if (doc) return toPlain<Customer>(doc);
  } catch (err) {
    console.warn("MongoDB getCustomerById fallback:", err);
  }
  return INITIAL_CUSTOMERS.find((customer) => customer.id === id);
}

export async function getCustomerByEmail(email: string): Promise<Customer | undefined> {
  const normalized = email.toLowerCase().trim();
  try {
    await connectDB();
    const doc = await CustomerModel.findOne({ email: normalized }).lean();
    if (doc) return toPlain<Customer>(doc);
  } catch (err) {
    console.warn("MongoDB getCustomerByEmail fallback:", err);
  }
  return INITIAL_CUSTOMERS.find((customer) => customer.email.toLowerCase().trim() === normalized);
}

export async function createCustomer(data: {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}): Promise<Customer> {
  const normalized = data.email.toLowerCase().trim();
  const newCustomer: Customer = {
    id: `cust-${Date.now()}`,
    name: data.name.trim(),
    email: normalized,
    phone: data.phone?.trim() || "",
    password: data.password || "",
    createdAt: new Date().toISOString(),
    ordersCount: 0,
    totalSpent: 0,
    addresses: [],
  };

  try {
    await connectDB();
    await CustomerModel.create(newCustomer);
  } catch (err) {
    console.warn("MongoDB createCustomer error:", err);
  }

  return newCustomer;
}

export async function updateCustomerProfile(
  idOrEmail: string,
  updates: { name?: string; email?: string; phone?: string; password?: string }
): Promise<Customer | null> {
  try {
    await connectDB();
    const query = {
      $or: [
        { id: idOrEmail },
        { email: idOrEmail.toLowerCase().trim() },
      ],
    };

    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name.trim();
    if (updates.email !== undefined) updateData.email = updates.email.toLowerCase().trim();
    if (updates.phone !== undefined) updateData.phone = updates.phone.trim();
    if (updates.password !== undefined && updates.password.length > 0) updateData.password = updates.password;

    const doc = await CustomerModel.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    ).lean();

    if (doc) {
      return toPlain<Customer>(doc)!;
    }
  } catch (err) {
    console.warn("MongoDB updateCustomerProfile error:", err);
  }
  return null;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  try {
    await connectDB();
    const res = await CustomerModel.deleteOne({ id });
    return res.deletedCount > 0;
  } catch (err) {
    console.warn("MongoDB deleteCustomer error:", err);
    return false;
  }
}

async function recordCustomerFromOrder(order: Order) {
  try {
    await connectDB();
    const email = order.customer.email.toLowerCase().trim();
    const existing = await CustomerModel.findOne({ email });

    if (existing) {
      existing.ordersCount = (existing.ordersCount || 0) + 1;
      existing.totalSpent = (existing.totalSpent || 0) + order.total;
      if (order.customer.phone && !existing.phone) {
        existing.phone = order.customer.phone;
      }
      if (order.shippingAddress) {
        existing.addresses = existing.addresses || [];
        existing.addresses.push(order.shippingAddress);
      }
      await existing.save();
    } else {
      await CustomerModel.create({
        id: `cust-${Date.now()}`,
        name: order.customer.name,
        email,
        phone: order.customer.phone || "",
        ordersCount: 1,
        totalSpent: order.total,
        addresses: order.shippingAddress ? [order.shippingAddress] : [],
      });
    }
  } catch (err) {
    console.warn("recordCustomerFromOrder error:", err);
  }
}

/* ──────────────── CONTACT MESSAGES ──────────────── */

const INITIAL_MESSAGES: ContactMessage[] = [
  {
    id: "msg-1",
    name: "Mahnoor Tariq",
    email: "mahnoor@example.com",
    phone: "+92 333 4567890",
    subject: "Bridal Customization Appointment",
    message: "Hi, I am interested in customizing the Husan Ara Bridal dress for my wedding in December. Can I book a studio appointment at MM Alam Road?",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: "read",
    replyNotes: "Customer invited to MM Alam studio for consultation.",
  },
  {
    id: "msg-2",
    name: "Zainab Chaudhry",
    email: "zainab.c@example.com",
    phone: "+1 312 555 0192",
    subject: "International Shipping to Chicago",
    message: "Hello! I live in Chicago and would like to know if the Maahi II collection can be delivered within 8 days for an Eid gathering?",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: "unread",
  },
];

export async function getContactMessages(): Promise<ContactMessage[]> {
  try {
    await connectDB();
    const docs = await ContactMessageModel.find({}).sort({ createdAt: -1 }).lean();
    if (docs && docs.length > 0) {
      return toPlainArray<ContactMessage>(docs);
    }
  } catch (err) {
    console.warn("MongoDB getContactMessages fallback:", err);
  }
  return INITIAL_MESSAGES;
}

export async function saveContactMessage(data: Omit<ContactMessage, "id" | "createdAt" | "status">): Promise<ContactMessage> {
  const newMessage: ContactMessage = {
    id: `msg-${Date.now()}`,
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    subject: data.subject || "General Inquiry",
    message: data.message,
    createdAt: new Date().toISOString(),
    status: "unread",
  };

  try {
    await connectDB();
    await ContactMessageModel.create(newMessage);
    // Send email notification via nodemailer
    sendContactFormNotification({
      name: newMessage.name,
      email: newMessage.email,
      phone: newMessage.phone,
      subject: newMessage.subject,
      message: newMessage.message,
    }).catch((err) => console.warn("Nodemailer contact notification notice:", err));
  } catch (err) {
    console.warn("MongoDB saveContactMessage error:", err);
  }

  return newMessage;
}

export async function updateMessageStatus(id: string, status: "unread" | "read" | "replied", replyNotes?: string): Promise<ContactMessage | null> {
  try {
    await connectDB();
    const doc = await ContactMessageModel.findOneAndUpdate(
      { id },
      { $set: { status, ...(replyNotes !== undefined ? { replyNotes } : {}) } },
      { new: true }
    ).lean();
    if (doc) return toPlain<ContactMessage>(doc)!;
  } catch (err) {
    console.warn("MongoDB updateMessageStatus error:", err);
  }
  return null;
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  try {
    await connectDB();
    const res = await ContactMessageModel.deleteOne({ id });
    return res.deletedCount > 0;
  } catch (err) {
    console.warn("MongoDB deleteContactMessage error:", err);
    return false;
  }
}

/* ──────────────── BLOGS ──────────────── */

export async function getBlogs(): Promise<BlogPost[]> {
  try {
    await connectDB();
    const docs = await BlogPostModel.find({}).sort({ publishedAt: -1, createdAt: -1 }).lean();
    if (docs && docs.length > 0) {
      return toPlainArray<BlogPost>(docs);
    }
  } catch (err) {
    console.warn("MongoDB getBlogs fallback:", err);
  }
  return SEED_BLOGS;
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | undefined> {
  try {
    await connectDB();
    const doc = await BlogPostModel.findOne({ $or: [{ slug }, { id: slug }] }).lean();
    const b = toPlain<BlogPost>(doc);
    if (b) return b;
  } catch (err) {
    console.warn("MongoDB getBlogBySlug fallback:", err);
  }
  return SEED_BLOGS.find((b) => b.slug === slug || b.id === slug);
}

export async function saveBlog(blog: Partial<BlogPost> & { title: string; content: string }): Promise<BlogPost> {
  const slug =
    blog.slug ||
    blog.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const id = blog.id || `blog-${Date.now()}`;

  const fullBlog: BlogPost = {
    id,
    slug,
    title: blog.title,
    excerpt: blog.excerpt || blog.content.slice(0, 160) + "...",
    content: blog.content,
    coverImage: blog.coverImage || "https://sillhouete.com/cdn/shop/articles/muslim_wedding_rituals_34c9db87-5834-4bff-a661-55201ade3345.png?v=1789022954&width=900",
    author: blog.author || "Sillhouete Editorial",
    publishedAt: blog.publishedAt || new Date().toISOString().split("T")[0],
    category: blog.category || "Fashion & Style",
    tags: blog.tags && blog.tags.length ? blog.tags : ["Fashion", "Sillhouete"],
    readTime: blog.readTime || "5 min read",
  };

  try {
    await connectDB();
    await BlogPostModel.findOneAndUpdate(
      { $or: [{ id }, { slug }] },
      { $set: fullBlog },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.warn("MongoDB saveBlog error:", err);
  }

  return fullBlog;
}

export async function deleteBlog(id: string): Promise<boolean> {
  try {
    await connectDB();
    const res = await BlogPostModel.deleteOne({ $or: [{ id }, { slug: id }] });
    return res.deletedCount > 0;
  } catch (err) {
    console.warn("MongoDB deleteBlog error:", err);
    return false;
  }
}

/* ──────────────── SETTINGS ──────────────── */

const INITIAL_SETTINGS: SiteSettings = {
  storeName: SITE.name,
  title: SITE.title,
  description: SITE.description,
  email: SITE.email,
  phone: "+92 331 0397865",
  whatsapp: SITE.whatsapp,
  studioAddress: "Sillhouete, Almas Tower, MM Alam Rd, Block T, Gulberg 2, Lahore",
  officeAddress: "327-B, Street 7, Lane 15, Cavalry Ground, Lahore",
  usaOfficeAddress: "ADVENT BUSINESS CONSULTAX LLC, 18w100 22nd St, Ste 124, Oakbrook Terrace, IL, Zip Code 60181",
  announcements: ANNOUNCEMENTS,
  freeShippingThreshold: 140000, // ~ $500 in PKR
  standardShippingFee: 250,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeEnabled: true,
  currency: "PKR",
  adminEmail: "admin@sillhouete.com",
  adminPasswordHash: "admin123",
  bankName: "Meezan Bank",
  bankAccountTitle: "SILLHOUETE",
  bankIban: "PK80MEZN0002160109517881",
  discountCodes: [
    { code: "WELCOME5", percent: 5, active: true },
    { code: "EID2026", percent: 10, active: true },
  ],
};

export async function getSettings(): Promise<SiteSettings> {
  let settings: SiteSettings = {
    ...INITIAL_SETTINGS,
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  };

  try {
    await connectDB();
    let doc = await SiteSettingsModel.findOne({}).lean();
    if (!doc) {
      const created = await SiteSettingsModel.create(INITIAL_SETTINGS);
      doc = created.toObject();
    }
    const dbSettings = toPlain<SiteSettings>(doc);
    if (dbSettings) {
      settings = { ...settings, ...dbSettings };
    }
  } catch (err) {
    console.warn("MongoDB getSettings fallback:", err);
  }

  if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    settings.stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  }
  if (process.env.STRIPE_SECRET_KEY) {
    settings.stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  }

  return settings;
}

export async function updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  try {
    await connectDB();
    const cleanUpdates = { ...updates };
    delete (cleanUpdates as Record<string, unknown>).id;
    delete (cleanUpdates as Record<string, unknown>)._id;
    delete (cleanUpdates as Record<string, unknown>).__v;
    delete (cleanUpdates as Record<string, unknown>).stripeSecretKeyConfigured;

    let doc = await SiteSettingsModel.findOne({});
    if (!doc) {
      doc = await SiteSettingsModel.create({ ...INITIAL_SETTINGS, ...cleanUpdates });
    } else {
      for (const [key, val] of Object.entries(cleanUpdates)) {
        if (val !== undefined) {
          (doc as unknown as Record<string, unknown>)[key] = val;
          doc.markModified(key);
        }
      }
      await doc.save();
    }

    const plain = toPlain<SiteSettings>(doc.toObject());
    if (plain) return plain;
  } catch (err) {
    console.error("MongoDB updateSettings error:", err);
  }

  return { ...INITIAL_SETTINGS, ...updates };
}
