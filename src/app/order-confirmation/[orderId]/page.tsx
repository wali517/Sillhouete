import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, PackageCheck, Truck, ShieldCheck, MapPin, Mail, Phone } from "lucide-react";
import { getOrderById } from "@/lib/db";
import { formatPrice } from "@/lib/format";

type Props = { params: Promise<{ orderId: string }> };

export async function generateMetadata({ params }: Props) {
  const { orderId } = await params;
  return { title: `Order Confirmation ${orderId} – Sillhouete` };
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-12 md:px-8">
      {/* Success banner */}
      <div className="border border-line bg-soft p-6 md:p-10 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <p className="text-xs uppercase tracking-widest text-black/60">Order Placed Successfully</p>
        <h1 className="heading mt-2 text-[28px] md:text-[34px]">
          Thank you, {order.shippingAddress.firstName}!
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Your order number is <strong className="text-black font-mono font-bold text-base">#{order.orderNumber}</strong>
        </p>
        <p className="mt-1 text-xs text-black/60">
          A confirmation email has been dispatched to <strong>{order.customer.email}</strong>.
        </p>
      </div>

      {/* Order Status Tracker */}
      <div className="mt-8 border border-line p-6">
        <h2 className="heading text-[16px] mb-6">Order Status Tracking</h2>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="space-y-2">
            <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-black text-white font-bold">
              ✓
            </div>
            <p className="font-semibold">Confirmed</p>
            <p className="text-[10px] text-black/50">Payment verified</p>
          </div>
          <div className="space-y-2">
            <div className={`mx-auto grid h-8 w-8 place-items-center rounded-full font-bold ${
              order.status === "processing" || order.status === "shipped" || order.status === "delivered"
                ? "bg-black text-white"
                : "border border-line bg-soft text-black/40"
            }`}>
              2
            </div>
            <p className="font-semibold">Tailoring &amp; Packing</p>
            <p className="text-[10px] text-black/50">Studio production</p>
          </div>
          <div className="space-y-2">
            <div className={`mx-auto grid h-8 w-8 place-items-center rounded-full font-bold ${
              order.status === "shipped" || order.status === "delivered"
                ? "bg-black text-white"
                : "border border-line bg-soft text-black/40"
            }`}>
              3
            </div>
            <p className="font-semibold">Shipped</p>
            <p className="text-[10px] text-black/50">
              {order.trackingNumber ? `Tracking: ${order.trackingNumber}` : "In transit"}
            </p>
          </div>
          <div className="space-y-2">
            <div className={`mx-auto grid h-8 w-8 place-items-center rounded-full font-bold ${
              order.status === "delivered"
                ? "bg-black text-white"
                : "border border-line bg-soft text-black/40"
            }`}>
              4
            </div>
            <p className="font-semibold">Delivered</p>
            <p className="text-[10px] text-black/50">At your doorstep</p>
          </div>
        </div>
      </div>

      {/* Order Details & Summary */}
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {/* Ordered Items */}
        <div className="border border-line p-6 space-y-4">
          <h2 className="heading text-[18px] border-b border-line pb-3">
            Items Ordered ({order.items.reduce((n, i) => n + i.quantity, 0)})
          </h2>
          <div className="divide-y divide-line">
            {order.items.map((item) => (
              <div key={`${item.id}-${item.size}`} className="flex gap-4 py-3">
                <div className="relative h-20 w-16 shrink-0 border border-line bg-soft">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between text-xs">
                  <div>
                    <h3 className="font-semibold uppercase tracking-wide">{item.title}</h3>
                    <p className="text-black/60">Size: {item.size} • Qty: {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-sm">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-line pt-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount ({order.discountCode})</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</span>
            </div>
            <div className="border-t border-line pt-2 flex justify-between text-base font-bold">
              <span>Total Amount</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Customer & Shipping Information */}
        <div className="space-y-6">
          <div className="border border-line p-6 space-y-3 text-xs">
            <h2 className="heading text-[18px] border-b border-line pb-3">Delivery Information</h2>

            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-black/60 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-black">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </strong>
                <p className="text-black/70">{order.shippingAddress.address}</p>
                {order.shippingAddress.apartment && (
                  <p className="text-black/70">{order.shippingAddress.apartment}</p>
                )}
                <p className="text-black/70">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p className="text-black/70 font-semibold">{order.shippingAddress.country}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-line">
              <Mail className="h-4 w-4 text-black/60 shrink-0" />
              <span>{order.shippingAddress.email}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-black/60 shrink-0" />
              <span>{order.shippingAddress.phone}</span>
            </div>
          </div>

          <div className="border border-line p-6 space-y-3 text-xs">
            <h2 className="heading text-[18px] border-b border-line pb-3">Payment Details</h2>
            <div className="flex justify-between items-center">
              <span>Payment Method:</span>
              <strong className="capitalize">
                {order.paymentMethod === "stripe"
                  ? "Stripe Card Payment"
                  : order.paymentMethod === "cod"
                  ? "Cash on Delivery (COD)"
                  : "Direct Bank Transfer"}
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Payment Status:</span>
              <span className={`inline-block px-2 py-0.5 font-bold uppercase rounded text-[10px] ${
                order.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}>
                {order.paymentStatus}
              </span>
            </div>
            {order.stripePaymentIntentId && (
              <div className="flex justify-between items-center text-black/60">
                <span>Stripe Reference:</span>
                <span className="font-mono">{order.stripePaymentIntentId}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Link href="/" className="btn flex-1 py-3 text-xs text-center bg-black text-white hover:bg-neutral-800">
              Return to Store
            </Link>
            <Link href="/collections/new-arrivals" className="btn flex-1 py-3 text-xs text-center bg-black text-white hover:bg-neutral-800">
              Shop New Arrivals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
