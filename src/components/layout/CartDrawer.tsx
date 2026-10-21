"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, X } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";

export default function CartDrawer() {
  const router = useRouter();
  const {
    items,
    subtotal,
    cartOpen,
    setCartOpen,
    setQuantity,
    removeItem,
    formatPrice,
    orderNote,
    setOrderNote,
  } = useStore();
  const [agree, setAgree] = useState(true);
  const [notice, setNotice] = useState("");

  const close = () => setCartOpen(false);

  const handleCheckout = () => {
    if (!agree) {
      return setNotice("Please agree with the terms and conditions to proceed to checkout");
    }
    setCartOpen(false);
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Your Cart"
            className="fixed bottom-0 right-0 top-0 z-[100] flex w-full max-w-md flex-col bg-white shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            {/* Header matching Image 4 */}
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-[#111111]">
                CART
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close cart"
                className="p-1 text-black/70 hover:text-black transition-colors"
              >
                <X className="h-5 w-5 stroke-[1.5]" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                <p className="text-base font-normal tracking-wide text-neutral-800">Your cart is currently empty.</p>
                <p className="mt-1 text-xs text-neutral-500">Discover our handcrafted Pakistani luxury collections.</p>
                <Link
                  href="/collections/1"
                  onClick={close}
                  className="mt-6 bg-[#111111] hover:bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-[0.24em] transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <>
                {/* Items List matching Image 4 */}
                <ul className="flex-1 divide-y divide-black/10 overflow-y-auto px-6">
                  {items.map((i) => (
                    <li key={i.key} className="flex gap-4 py-4">
                      <Link
                        href={`/products/${i.product.handle}`}
                        onClick={close}
                        className="relative h-28 w-[76px] shrink-0 border border-neutral-200 bg-neutral-50"
                      >
                        <Image
                          src={i.product.image}
                          alt={i.product.alt}
                          fill
                          sizes="76px"
                          className="object-cover"
                        />
                      </Link>
                      <div className="flex flex-1 flex-col text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/products/${i.product.handle}`}
                            onClick={close}
                            className="font-normal text-xs md:text-sm uppercase tracking-wide text-black hover:underline"
                          >
                            {i.product.title}
                          </Link>
                          <span className="text-xs font-semibold text-black whitespace-nowrap">
                            {formatPrice((i.unitPrice ?? i.product.price) * i.quantity)}
                          </span>
                        </div>

                        <div className="mt-1 space-y-0.5 text-xs text-neutral-600">
                          <p>Size: <span className="text-black font-medium">{i.size}</span></p>
                          {i.dupatta && <p>Dupatta: <span className="text-black font-medium">{i.dupatta}</span></p>}
                          {i.adOn && <p>Ad Ons: <span className="text-black font-medium">{i.adOn}</span></p>}
                          {i.expedite && <p className="text-amber-700 font-semibold">Express Shipping (5-6 Days)</p>}
                          {i.slip && <p>Slip: <span className="text-black font-medium">{i.slip}</span></p>}
                        </div>

                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex items-center border border-neutral-300 bg-white">
                            <button
                              type="button"
                              aria-label="Reduce item quantity"
                              onClick={() => setQuantity(i.key, i.quantity - 1)}
                              className="grid h-7 w-7 place-items-center hover:bg-neutral-100 text-neutral-600 transition-colors"
                            >
                              <Minus className="h-3 w-3 stroke-[1.5]" />
                            </button>
                            <span className="w-7 text-center text-xs font-medium text-black" aria-live="polite">
                              {i.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase item quantity"
                              onClick={() => setQuantity(i.key, i.quantity + 1)}
                              className="grid h-7 w-7 place-items-center hover:bg-neutral-100 text-neutral-600 transition-colors"
                            >
                              <Plus className="h-3 w-3 stroke-[1.5]" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(i.key)}
                            className="text-[11px] text-neutral-500 underline hover:text-black transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Order Note Section matching Image 4 */}
                <div className="border-t border-black/10 px-6 py-4 bg-white">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.24em] text-black mb-2">
                    ORDER NOTE
                  </label>
                  <textarea
                    rows={3}
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder=""
                    className="w-full border border-neutral-300 p-2.5 text-xs outline-none focus:border-black transition-colors resize-none bg-white text-black"
                  />
                </div>

                {/* Footer and Checkout matching Image 4 */}
                <div className="border-t border-black/10 bg-white px-6 py-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.24em] text-black">
                    <span>SUBTOTAL</span>
                    <span className="text-sm font-semibold tracking-normal">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Shipping, taxes, and discount codes calculated at checkout.
                  </p>

                  <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[11px] uppercase tracking-wider text-neutral-700">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => {
                        setAgree(e.target.checked);
                        setNotice("");
                      }}
                      className="mt-0.5 accent-black h-3.5 w-3.5 rounded-none"
                    />
                    <span>
                      I AGREE WITH THE{" "}
                      <Link href="/pages/terms-and-conditions" onClick={close} className="underline text-black hover:text-neutral-600">
                        TERMS AND CONDITIONS
                      </Link>
                    </span>
                  </label>

                  {notice && (
                    <p role="status" className="mt-2 text-center text-xs text-red-600 font-medium">
                      {notice}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="mt-4 w-full bg-[#111111] hover:bg-black text-white py-3.5 text-xs font-bold uppercase tracking-[0.28em] transition-colors"
                  >
                    CHECK OUT
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
