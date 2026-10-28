"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, MessageCircle } from "lucide-react";
import type { Product } from "@/types";
import { useStore } from "@/components/providers/StoreProvider";

const SIZES = ["XS", "S", "M", "L", "XL"];
const EXPEDITE_FEE = 8000;
const SAME_AS_SAMPLE = "Same as sample";
const WITH_SLEEVES = "With sleeves";

const isNone = (v?: string | null) => !v || v.trim().toLowerCase() === "none";

/** Unique, non-"None" option values for a variant slot, in product order. */
function optionValues(product: Product, slot: "option2" | "option3", fallback?: string[]) {
  const fromVariants = (product.variants ?? [])
    .map((v) => v[slot])
    .filter((v): v is string => !isNone(v));
  const unique = Array.from(new Set(fromVariants));
  if (unique.length > 0) return unique;
  return (fallback ?? []).filter((v) => !isNone(v));
}

const labelCls = "mb-2 font-serif text-[13px] font-bold uppercase tracking-[0.22em] text-black";

export default function AddToCart({ product, children }: { product: Product; children?: ReactNode }) {
  const router = useRouter();
  const { addToCart, setCartOpen, formatPrice } = useStore();

  const dupattaValues = useMemo(() => optionValues(product, "option2", product.dupattaOptions), [product]);
  const adOnValues = useMemo(() => optionValues(product, "option3", product.adOnOptions), [product]);

  const [size, setSize] = useState("XS");
  const [dupatta, setDupatta] = useState("None");
  const [adOn, setAdOn] = useState("None");
  const [expedite, setExpedite] = useState(false);
  const [extra, setExtra] = useState(SAME_AS_SAMPLE);
  const [qty, setQty] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  /** Price of the exact variant for a size/dupatta/add-on combination (falls back to base price). */
  const variantPrice = (sz: string, d: string, a: string) => {
    const match = product.variants?.find(
      (v) =>
        (!v.option1 || v.option1.toLowerCase() === sz.toLowerCase()) &&
        (isNone(v.option2) ? isNone(d) : (v.option2 ?? "").toLowerCase() === d.toLowerCase()) &&
        (isNone(v.option3) ? isNone(a) : (v.option3 ?? "").toLowerCase() === a.toLowerCase()),
    );
    return match?.price ?? product.price;
  };

  const unitPrice = variantPrice(size, dupatta, adOn) + (expedite ? EXPEDITE_FEE : 0);
  const priceDiff = (d: string, a: string) => variantPrice(size, d, a) - variantPrice(size, "None", "None");

  const payload = () => ({
    size,
    dupatta: !isNone(dupatta) ? dupatta : undefined,
    adOn: !isNone(adOn) ? adOn : undefined,
    expedite,
    slip: extra === WITH_SLEEVES ? WITH_SLEEVES : undefined,
    unitPrice,
    quantity: qty,
  });

  const handleAddToCart = () => {
    addToCart(product, payload());
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2200);
  };

  const handleBuyNow = () => {
    addToCart(product, payload());
    setCartOpen(false);
    router.push("/checkout");
  };

  const dynamicSku = `${product.sku || product.handle.toUpperCase()}-${size}`;

  const optionButton = (selected: boolean) =>
    `h-[38px] px-4 text-[13px] transition-colors cursor-pointer flex items-center justify-center border-2 ${
      selected ? "border-black text-black font-bold" : "border-neutral-300 text-neutral-500 font-bold hover:border-neutral-500"
    }`;

  return (
    <div className="space-y-5">
      {/* Price (updates with the chosen variant) */}
      <div className="flex items-baseline gap-3">
        <span className="text-[22px] font-bold text-black">{formatPrice(unitPrice)}</span>
        {product.originalPrice && (
          <span className="text-sm text-neutral-400 line-through">{formatPrice(product.originalPrice)}</span>
        )}
      </div>

      {children}

      {/* SIZE */}
      <div>
        <div className={labelCls}>Size</div>
        <div className="flex flex-wrap gap-3">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              aria-pressed={size === s}
              className={`${optionButton(size === s)} min-w-[52px] font-sans`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* DUPATTA — only for products that really have the option */}
      {dupattaValues.length > 0 && (
        <div>
          <div className={labelCls}>Dupatta</div>
          <div className="flex flex-wrap gap-3">
            {["None", ...dupattaValues].map((opt) => {
              const diff = isNone(opt) ? 0 : priceDiff(opt, adOn) - priceDiff("None", adOn);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDupatta(opt)}
                  aria-pressed={dupatta === opt}
                  className={`${optionButton(dupatta === opt)} font-sans`}
                >
                  {opt}
                  {diff > 0 && <span className="ml-1 font-normal">(+{formatPrice(diff)})</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* AD ONS — only for products that really have the option */}
      {adOnValues.length > 0 && (
        <div>
          <div className={labelCls}>Ad Ons</div>
          <div className="flex flex-wrap gap-3">
            {["None", ...adOnValues].map((opt) => {
              const diff = isNone(opt) ? 0 : priceDiff(dupatta, opt) - priceDiff(dupatta, "None");
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAdOn(opt)}
                  aria-pressed={adOn === opt}
                  className={`${optionButton(adOn === opt)} font-sans`}
                >
                  {opt}
                  {diff > 0 && <span className="ml-1 font-normal">(+{formatPrice(diff)})</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* EXPEDITE ORDER */}
      <div>
        <div className={labelCls}>Expedite Order</div>
        <label className="flex items-start gap-3 border border-neutral-200 bg-white px-3.5 py-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={expedite}
            onChange={(e) => setExpedite(e.target.checked)}
            className="mt-1 h-4 w-4 accent-black cursor-pointer"
          />
          <span className="font-serif text-[13px] font-bold uppercase tracking-[0.2em] text-black leading-relaxed">
            Express-Shipping (5-6 Working Days) [+PKR {EXPEDITE_FEE}]
          </span>
        </label>
      </div>

      {/* YOU MAY ALSO ADD */}
      <div>
        <div className={labelCls}>You may also add:</div>
        <div className="space-y-2">
          {[SAME_AS_SAMPLE, WITH_SLEEVES].map((opt) => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="radio"
                name="extra_option"
                checked={extra === opt}
                onChange={() => setExtra(opt)}
                className="h-4 w-4 accent-[#0b72ff] cursor-pointer"
              />
              <span className="font-serif text-[13px] font-bold uppercase tracking-[0.22em] text-black">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-1 pl-5">
        <button
          type="button"
          aria-label="Reduce quantity"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="grid h-9 w-9 place-items-center rounded-full border border-neutral-300 text-neutral-600 hover:text-black hover:border-black transition-colors"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center text-xs text-black" aria-live="polite">
          {qty}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty((q) => q + 1)}
          className="grid h-9 w-9 place-items-center rounded-full border border-neutral-300 text-neutral-600 hover:text-black hover:border-black transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full bg-black py-4 font-sans text-[15px] font-bold uppercase text-white transition-opacity hover:opacity-85 cursor-pointer"
        >
          {addedNotice ? "✓ Added to cart" : "Add to cart"}
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          className="w-full border border-black bg-white py-4 font-sans text-[15px] font-bold uppercase text-black transition-colors hover:bg-neutral-100 cursor-pointer"
        >
          Buy it now
        </button>

        <div className="flex items-center justify-center gap-2 py-1 font-serif text-xs text-neutral-700">
          <span className="text-[13px] text-neutral-600">We accept</span>
          {/* Real Google Pay SVG badge */}
          <span className="inline-flex items-center justify-center border border-neutral-300 rounded-none px-2 py-0.5 bg-white text-[10px] font-bold tracking-wider text-black shadow-xs">
            <svg className="h-3.5 w-8 mr-1" viewBox="0 0 38 15" fill="none">
              <path d="M5.9 7.4v4.4H4.5V.2h3.8c1 0 1.9.3 2.6 1 .7.7 1.1 1.6 1.1 2.6s-.4 1.9-1.1 2.6c-.7.7-1.6 1-2.6 1H5.9zm0-5.9v4.5h2.4c.7 0 1.2-.2 1.6-.6.4-.4.7-1 .7-1.6s-.3-1.2-.7-1.6c-.4-.4-1-.7-1.6-.7H5.9z" fill="#3c4043"/>
              <path d="M15.3 11.8c-.8 0-1.5-.2-2.1-.7-.6-.5-.9-1.1-.9-1.9 0-.8.3-1.5.9-2 .6-.5 1.4-.8 2.3-.8.7 0 1.4.1 1.9.4v-.4c0-.6-.2-1-.6-1.3-.4-.3-1-.5-1.5-.5-.7 0-1.3.2-1.7.5l-.5-1c.6-.4 1.4-.7 2.4-.7 1.1 0 2 .3 2.6.9.6.6.9 1.4.9 2.5v4.9h-1.3v-1.1h-.1c-.6.8-1.4 1.2-2.3 1.2zm.3-1.2c.6 0 1.1-.2 1.6-.7.4-.4.7-1 .7-1.6-.5-.4-1.1-.6-1.8-.6-.6 0-1.1.1-1.5.4-.4.3-.6.7-.6 1.2 0 .4.2.8.5 1 .3.2.7.3 1.1.3z" fill="#3c4043"/>
              <path d="M26.2 4.7l-4.5 10.4h-1.5l1.7-3.7-3-6.7h1.6l2.1 5.1h.1l2.1-5.1h1.4z" fill="#3c4043"/>
              <path d="M36.1 7.2c0-.4 0-.8-.1-1.2H31v2.3h2.9c-.1.7-.5 1.3-1.1 1.7v1.4h1.8c1-1 1.5-2.4 1.5-4.2z" fill="#4285F4"/>
              <path d="M31 12.4c1.4 0 2.5-.5 3.4-1.3l-1.8-1.4c-.5.3-1 .5-1.6.5-1.2 0-2.3-.8-2.7-2h-1.8v1.4c.9 1.8 2.7 2.8 4.5 2.8z" fill="#34A853"/>
              <path d="M28.3 8.2c-.1-.3-.2-.7-.2-1s.1-.7.2-1V4.8h-1.8c-.4.7-.6 1.5-.6 2.4s.2 1.7.6 2.4l1.8-1.4z" fill="#FBBC04"/>
              <path d="M31 3.8c.8 0 1.4.3 1.9.8l1.4-1.4C33.4 2.4 32.3 2 31 2c-1.8 0-3.6 1-4.5 2.8l1.8 1.4c.4-1.2 1.5-2.4 2.7-2.4z" fill="#EA4335"/>
            </svg>
          </span>
          {/* Real Apple Pay SVG badge */}
          <span className="inline-flex items-center justify-center border border-neutral-300 rounded-none px-2 py-0.5 bg-white text-[10px] font-bold tracking-wider text-black shadow-xs">
            <svg className="h-3.5 w-8" viewBox="0 0 50 20" fill="currentColor">
              <path d="M8.5 3.2c-.6.8-1.6 1.4-2.6 1.3-.1-1 .4-2 1-2.6.6-.7 1.7-1.2 2.6-1.2.1 1-.4 1.9-1 2.5zm1 1.4c-1.5-.1-2.7.9-3.4.9-.7 0-1.7-.8-2.9-.8-1.5 0-2.8.9-3.6 2.2-1.6 2.7-.4 6.7 1.1 8.9.7 1.1 1.6 2.3 2.8 2.2 1.1 0 1.6-.7 2.9-.7 1.3 0 1.7.7 2.8.7 1.2 0 2-1.1 2.7-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.4-.9-2.4-3.6 0-2.3 1.9-3.3 2-3.5-1.1-1.6-2.8-1.5-3.3-1.5zm10.7-.7c-2.8 0-4.6 2-4.6 5s1.8 5 4.6 5c1.4 0 2.5-.5 3.2-1.5v1.3h2.3V.5h-2.3v3.7c-.8-.9-1.8-1.3-3.2-1.3zm.5 8.1c-1.7 0-2.8-1.2-2.8-3.1s1.1-3.1 2.8-3.1c1.7 0 2.8 1.2 2.8 3.1 0 1.8-1.1 3.1-2.8 3.1zm12.3-4.5c0-.8-.7-1.4-1.8-1.4-1 0-1.8.6-1.9 1.4h3.7zm-3.8 2.2c.1 1.3 1.2 2.1 2.6 2.1 1.1 0 1.9-.4 2.3-1.2h2.2c-.6 1.9-2.3 3.1-4.5 3.1-2.8 0-4.8-2-4.8-5 0-3 2-5 4.8-5 2.9 0 4.7 2 4.7 4.9v1.1h-7.3zm12.5-3.7l-2.7 6.9h-2.4l2.8-6.9v-.1l-2.6-6.4h2.5l1.4 4.3 1.4-4.3h2.4l-2.8 6.5z"/>
            </svg>
          </span>
        </div>

        <a
          href={`https://wa.me/923310397865?text=${encodeURIComponent(
            `Hi Sillhouete, I am interested in ${product.title} (SKU: ${dynamicSku}, Size: ${size}${
              !isNone(dupatta) ? `, Dupatta: ${dupatta}` : ""
            }). Could you please share more details?`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 bg-[#0a8f2e] hover:bg-[#087a27] text-white py-3.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <MessageCircle className="h-4 w-4 fill-white text-white" />
          <span>Chat with fashion consultant</span>
        </a>
      </div>
    </div>
  );
}
