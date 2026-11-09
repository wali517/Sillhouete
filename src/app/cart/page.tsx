"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/types";

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
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products?limit=5")
      .then((r) => r.json())
      .then((d) => setRecentProducts(d.products?.slice(0, 5) ?? []))
      .catch(() => {});
  }, []);

  const handleCheckout = () => {
    if (!agree) {
      setError("You must agree with the terms and conditions of sales to check out");
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 sm:px-6 md:px-8 py-10 md:py-14">
      {/* ─── Centered Title & Continue Shopping Link (Matching sillhouete.com) ─── */}
      <div className="text-center mb-10 md:mb-14">
        <h1 className="font-serif text-[26px] md:text-[32px] uppercase tracking-[0.15em] text-[#111111]">
          CART
        </h1>
        <Link
          href="/collections/new-arrivals"
          className="inline-block mt-2 font-serif text-[13px] md:text-[14px] text-[#111111] underline underline-offset-4 hover:opacity-75 transition-opacity"
        >
          Continue shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-serif text-[18px] text-[#1a1a1a] mb-2">
            Your cart is currently empty.
          </p>
          <p className="text-[13.5px] text-[#707070] mb-6">
            Explore our latest bridal, formal, and luxury pret collections.
          </p>
          <Link
            href="/collections/new-arrivals"
            className="inline-block bg-[#111111] hover:bg-black text-white font-serif text-[12px] uppercase tracking-[0.2em] py-3.5 px-8 transition-colors"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        /* ─── Main Cart Two-Column Grid ─── */
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_390px] items-start">
          {/* ════════════════════════════════════════
              LEFT COLUMN — Cart Items List
          ════════════════════════════════════════ */}
          <div className="divide-y divide-[#ebebeb]">
            {items.map((item) => {
              const itemPrice = item.unitPrice ?? item.product.price;
              return (
                <div
                  key={item.key}
                  className="py-6 first:pt-0 last:pb-0 flex gap-4 sm:gap-6 items-start justify-between"
                >
                  <div className="flex gap-4 sm:gap-6 items-start min-w-0">
                    {/* Product Thumbnail (vertical dress framing) */}
                    <Link
                      href={`/products/${item.product.handle}`}
                      className="relative w-[78px] sm:w-[92px] aspect-3/4 shrink-0 overflow-hidden bg-[#f4f4f4]"
                    >
                      <Image
                        src={item.product.image}
                        alt={item.product.title}
                        fill
                        sizes="92px"
                        className="object-cover"
                      />
                    </Link>

                    {/* Product Details */}
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.product.handle}`}
                        className="font-serif text-[15px] sm:text-[16px] text-[#1a1a1a] hover:underline block leading-snug"
                      >
                        {item.product.title}
                      </Link>

                      <div className="mt-1 space-y-0.5 text-[12.5px] sm:text-[13px] text-[#555555]">
                        <p>
                          <span className="font-semibold text-[#1a1a1a]">Size:</span> {item.size}
                        </p>
                        {item.dupatta && (
                          <p>
                            <span className="font-semibold text-[#1a1a1a]">Sleeves:</span> {item.dupatta}
                          </p>
                        )}
                        {item.adOn && (
                          <p>
                            <span className="font-semibold text-[#1a1a1a]">Add-on:</span> {item.adOn}
                          </p>
                        )}
                        {item.expedite && (
                          <p className="text-amber-800 font-medium">
                            Express Shipping (5-6 Days)
                          </p>
                        )}
                        {item.slip && (
                          <p>
                            <span className="font-semibold text-[#1a1a1a]">Slip:</span> {item.slip}
                          </p>
                        )}
                      </div>

                      {/* Quantity Selector: [ -  1  + ] */}
                      <div className="mt-3.5 inline-flex items-center border border-[#d9d9d9] bg-white">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.key, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#707070] hover:text-black transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-[12px] font-medium text-[#1a1a1a] select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.key, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#707070] hover:text-black transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove text link */}
                      <div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="block text-[12px] text-[#707070] hover:text-black underline underline-offset-2 mt-2 cursor-pointer transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Line Price on right */}
                  <div className="text-right shrink-0 pt-0.5 pl-3">
                    <span className="font-serif text-[14px] sm:text-[15px] text-[#1a1a1a] whitespace-nowrap">
                      {formatPrice(itemPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ════════════════════════════════════════
              RIGHT COLUMN — ORDER NOTE & Summary Box
              (#f7f7f7 card matching screenshot)
          ════════════════════════════════════════ */}
          <div className="bg-[#f7f7f7] p-6 sm:p-7 space-y-4">
            {/* ORDER NOTE */}
            <div>
              <h3 className="font-serif uppercase tracking-[0.2em] text-[12px] font-medium text-[#1a1a1a] mb-2.5">
                ORDER NOTE
              </h3>
              <textarea
                rows={4}
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                className="w-full bg-white border border-[#e1e1e1] p-3 text-[13px] text-[#1a1a1a] outline-none focus:border-black resize-y"
              />
            </div>

            {/* Subtotal */}
            <div className="flex items-center justify-between text-[13.5px] pt-1">
              <span className="text-[#333333]">Subtotal</span>
              <span className="font-serif text-[#1a1a1a] font-medium">
                {formatPrice(subtotal)}
              </span>
            </div>

            {/* Terms and conditions checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => {
                  setAgree(e.target.checked);
                  setError("");
                }}
                className="w-4 h-4 rounded-[2px] border-[#b5b5b5] text-black focus:ring-0 cursor-pointer"
              />
              <span className="font-serif uppercase tracking-[0.14em] text-[10.5px] sm:text-[11px] text-[#333333] leading-tight">
                I AGREE WITH THE TERMS AND CONDITIONS
              </span>
            </label>

            {error && (
              <p className="text-[12px] text-red-600 font-medium">{error}</p>
            )}

            {/* Solid Black CHECK OUT Button */}
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full bg-[#111111] hover:bg-black active:bg-neutral-900 text-white py-4 text-center font-serif text-[12px] md:text-[13px] uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer"
            >
              CHECK OUT
            </button>

            {/* Disclaimer */}
            <p className="text-center text-[11px] text-[#707070] pt-1 leading-snug">
              Shipping, taxes, and discount codes calculated at checkout.
            </p>
          </div>
        </div>
      )}

      {/* ─── RECENTLY VIEWED (5 Columns matching screenshot) ─── */}
      <section className="mt-20 md:mt-24 border-t border-[#e8e8e1] pt-12 md:pt-16">
        <h2 className="font-serif mb-8 text-center text-[18px] md:text-[20px] uppercase tracking-[0.2em] text-[#111111]">
          RECENTLY VIEWED
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
          {recentProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
