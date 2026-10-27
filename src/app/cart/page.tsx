"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, ShieldCheck } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/types";

const FREE_SHIPPING_THRESHOLD = 14000;

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    subtotal,
    setQuantity,
    removeItem,
    formatPrice,
    orderNote,
    setOrderNote,
  } = useStore();
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState("");
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products?limit=4")
      .then((r) => r.json())
      .then((d) => setRecentProducts(d.products?.slice(0, 4) ?? []))
      .catch(() => {});
  }, []);

  const handleCheckout = () => {
    if (!agree) {
      setError("Please accept the terms and conditions to proceed.");
      return;
    }
    router.push("/checkout");
  };

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8">
      <div className="mb-8 flex items-baseline justify-between border-b border-black/10 pb-4">
        <h1 className="heading text-[26px] md:text-[32px] uppercase tracking-wider text-black">
          Cart
        </h1>
        <Link
          href="/collections/1"
          className="text-xs uppercase tracking-wider text-black/70 hover:text-black underline underline-offset-4"
        >
          Continue shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-soft">
            <ShoppingBag className="h-10 w-10 text-black/40" />
          </div>
          <p className="text-lg font-medium">Your cart is currently empty.</p>
          <p className="mt-2 text-sm text-black/60">
            Explore our latest bridal, formal, and luxury pret collections.
          </p>
          <Link href="/collections/1" className="btn mt-6">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Items Section */}
          <div className="space-y-6">
            {/* Free shipping bar */}
            <div className="border border-line bg-soft p-4">
              <p className="text-sm">
                {remaining > 0 ? (
                  <>
                    Add <strong className="text-black">{formatPrice(remaining)}</strong> more to get{" "}
                    <strong>FREE Worldwide Delivery!</strong>
                  </>
                ) : (
                  <strong className="text-emerald-700">
                    You have qualified for FREE Worldwide Delivery!
                  </strong>
                )}
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full bg-black transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Items Table / Cards */}
            <div className="border border-line divide-y divide-line">
              {items.map((item) => {
                const itemPrice = item.unitPrice ?? item.product.price;
                return (
                  <div key={item.key} className="flex gap-4 p-4 md:gap-6 md:p-6">
                    <Link
                      href={`/products/${item.product.handle}`}
                      className="relative h-32 w-24 shrink-0 overflow-hidden border border-line bg-soft"
                    >
                      <Image
                        src={item.product.image}
                        alt={item.product.alt}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </Link>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <Link
                            href={`/products/${item.product.handle}`}
                            className="font-semibold uppercase tracking-wide hover:underline text-sm md:text-base"
                          >
                            {item.product.title}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            className="text-black/50 hover:text-sale p-1"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-1 space-y-0.5 text-xs text-black/70">
                          <p>
                            Size: <strong className="text-black">{item.size}</strong>
                          </p>
                          {item.dupatta && (
                            <p>
                              Dupatta: <strong className="text-black">{item.dupatta}</strong>
                            </p>
                          )}
                          {item.adOn && (
                            <p>
                              Ad Ons: <strong className="text-black">{item.adOn}</strong>
                            </p>
                          )}
                          {item.expedite && (
                            <p className="text-amber-700 font-semibold">
                              Express Shipping (5-6 Days)
                            </p>
                          )}
                          {item.slip && (
                            <p>
                              Slip: <strong className="text-black">{item.slip}</strong>
                            </p>
                          )}
                        </div>

                        <p className="mt-2 text-sm font-semibold">{formatPrice(itemPrice)}</p>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center border border-line bg-white">
                          <button
                            type="button"
                            onClick={() => setQuantity(item.key, item.quantity - 1)}
                            className="grid h-8 w-8 place-items-center hover:bg-soft"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.key, item.quantity + 1)}
                            className="grid h-8 w-8 place-items-center hover:bg-soft"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="font-semibold text-sm">
                          Total: {formatPrice(itemPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Note */}
            <div className="border border-line p-5">
              <label htmlFor="order-note" className="block text-sm font-semibold uppercase tracking-wide">
                Special Instructions or Custom Measurements
              </label>
              <p className="mt-1 text-xs text-black/60">
                Provide custom height, sleeve length, or specific delivery instructions.
              </p>
              <textarea
                id="order-note"
                rows={3}
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Write your note here..."
                className="mt-3 w-full border border-line p-3 text-sm outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Summary Section */}
          <div className="h-fit border border-line bg-soft p-6 space-y-5">
            <h2 className="heading text-[20px] border-b border-line pb-3">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-black/70 text-xs">
                <span>Shipping</span>
                <span>{subtotal >= FREE_SHIPPING_THRESHOLD ? "FREE" : "Calculated at checkout"}</span>
              </div>
            </div>

            <div className="border-t border-line pt-4 flex justify-between text-lg font-bold">
              <span>Estimated Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <label className="flex items-start gap-2 text-xs text-black/80 cursor-pointer">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => {
                  setAgree(e.target.checked);
                  setError("");
                }}
                className="mt-0.5"
              />
              <span>
                I agree to the{" "}
                <Link href="/pages/terms-and-conditions" className="underline font-semibold">
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link href="/pages/policies" className="underline font-semibold">
                  Refund Policy
                </Link>
                .
              </span>
            </label>

            {error && <p className="text-xs text-sale font-medium">{error}</p>}

            <button
              type="button"
              onClick={handleCheckout}
              className="btn w-full py-4 text-xs font-bold uppercase tracking-[0.25em] bg-black text-white hover:bg-black/85 flex items-center justify-center gap-2"
            >
              <span>Check Out</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-black/60 pt-2">
              <ShieldCheck className="h-4 w-4 text-black/70" />
              <span>Safe &amp; Secure Direct Card Checkout</span>
            </div>
          </div>
        </div>
      )}

      {/* Recently Viewed Section matching real site */}
      <section className="mt-20 border-t border-black/10 pt-12">
        <h2 className="heading mb-8 text-center text-[22px] md:text-[26px] uppercase tracking-[0.2em] text-[#111111]">
          Recently Viewed
        </h2>
        <div className="grid grid-cols-2 gap-[10px] md:grid-cols-4 md:gap-[17px]">
          {recentProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
