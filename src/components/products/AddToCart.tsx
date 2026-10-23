"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, MessageCircle } from "lucide-react";
import type { Product } from "@/types";
import { useStore } from "@/components/providers/StoreProvider";

const SIZES = ["XS", "S", "M", "L", "XL"];

const DEFAULT_DUPATTA_OPTIONS = [
  { label: "None", priceDiff: 0 },
  { label: "Organza Ruffled dupatta", priceDiff: 4600 },
  { label: "Organza dupatta with pearl spray", priceDiff: 2600 },
];

const DEFAULT_AD_ON_OPTIONS = [
  { label: "None", priceDiff: 0 },
  { label: "Grip Head scarf", priceDiff: 1600 },
];

const SLIP_OPTIONS = [
  "Select one",
  "Slip with sleeves (complimentary)",
  "Slip without sleeves (complimentary)",
];

export default function AddToCart({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart, setCartOpen, formatPrice } = useStore();

  const [size, setSize] = useState("XS");
  const [dupatta, setDupatta] = useState<string>("None");
  const [adOn, setAdOn] = useState<string>("None");
  const [expedite, setExpedite] = useState<boolean>(false);
  const [slip, setSlip] = useState<string>("Select one");
  const [qty, setQty] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  // Compute available dupatta options based on product data or defaults
  const dupattaOptions = useMemo(() => {
    if (product.dupattaOptions && product.dupattaOptions.length > 0) {
      return product.dupattaOptions.map((opt) => {
        let diff = 0;
        if (opt.includes("Ruffled")) diff = 4600;
        else if (opt.includes("pearl spray")) diff = 2600;
        return { label: opt, priceDiff: diff };
      });
    }
    return DEFAULT_DUPATTA_OPTIONS;
  }, [product]);

  const adOnOptions = DEFAULT_AD_ON_OPTIONS;

  // Compute live unit price matching exact variant or option diffs
  const calculatedUnitPrice = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      const match = product.variants.find((v) => {
        const opt1Match = !v.option1 || v.option1.toLowerCase() === size.toLowerCase();
        const opt2Match = !v.option2 || v.option2.toLowerCase() === dupatta.toLowerCase();
        const opt3Match = !v.option3 || v.option3.toLowerCase() === adOn.toLowerCase();
        return opt1Match && opt2Match && opt3Match;
      });
      if (match && match.price) {
        return match.price + (expedite ? 8000 : 0);
      }
    }

    let base = product.price;
    const d = dupattaOptions.find((opt) => opt.label === dupatta);
    if (d) base += d.priceDiff;

    const a = adOnOptions.find((opt) => opt.label === adOn);
    if (a) base += a.priceDiff;

    if (expedite) base += 8000;

    return base;
  }, [product, size, dupatta, adOn, expedite, dupattaOptions]);

  const handleAddToCart = () => {
    addToCart(product, {
      size,
      dupatta: dupatta !== "None" ? dupatta : undefined,
      adOn: adOn !== "None" ? adOn : undefined,
      expedite,
      slip: slip !== "Select one" ? slip : undefined,
      unitPrice: calculatedUnitPrice,
      quantity: qty,
    });
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2200);
  };

  const handleBuyNow = () => {
    addToCart(product, {
      size,
      dupatta: dupatta !== "None" ? dupatta : undefined,
      adOn: adOn !== "None" ? adOn : undefined,
      expedite,
      slip: slip !== "Select one" ? slip : undefined,
      unitPrice: calculatedUnitPrice,
      quantity: qty,
    });
    setCartOpen(false);
    router.push("/checkout");
  };

  const dynamicSku = `${product.sku || product.handle.toUpperCase()}-${size}`;

  return (
    <div className="space-y-3 pt-1 font-serif">
      {/* Live dynamic price indicator when variants change */}
      <div className="flex items-baseline gap-2 pt-1 pb-1">
        <span className="text-[22px] md:text-[26px] font-bold text-black">
          Rs.{calculatedUnitPrice.toLocaleString()}
        </span>
        {product.originalPrice && (
          <span className="text-sm text-neutral-400 line-through">
            Rs.{product.originalPrice.toLocaleString()}
          </span>
        )}
      </div>

      {/* 1. SIZE Selector with clean compact styling & Halant font */}
      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.05em] text-black">
          Size: <span className="font-normal text-neutral-600">{size}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => {
            const isSelected = size === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`min-w-[42px] h-[34px] px-3 text-xs font-semibold tracking-normal transition-all cursor-pointer flex items-center justify-center rounded-none ${
                  isSelected
                    ? "border-2 border-black bg-black text-white font-bold"
                    : "border border-neutral-300 bg-white text-neutral-800 hover:border-black"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DUPATTA Selector */}
      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.05em] text-black">
          Dupatta: <span className="font-normal text-neutral-600">{dupatta}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {dupattaOptions.map((opt) => {
            const isSelected = dupatta === opt.label;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => setDupatta(opt.label)}
                className={`h-[34px] px-3.5 text-xs tracking-normal transition-all cursor-pointer flex items-center justify-center rounded-none ${
                  isSelected
                    ? "border-2 border-black bg-black text-white font-bold"
                    : "border border-neutral-300 bg-white text-neutral-800 hover:border-black font-normal"
                }`}
              >
                <span>{opt.label}</span>
                {opt.priceDiff > 0 && (
                  <span className={`ml-1 text-[11px] ${isSelected ? "text-neutral-200" : "text-neutral-500"}`}>
                    (+Rs.{opt.priceDiff.toLocaleString()})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. AD ONS */}
      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.05em] text-black">
          Ad Ons: <span className="font-normal text-neutral-600">{adOn}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {adOnOptions.map((opt) => {
            const isSelected = adOn === opt.label;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => setAdOn(opt.label)}
                className={`h-[34px] px-3.5 text-xs tracking-normal transition-all cursor-pointer flex items-center justify-center rounded-none ${
                  isSelected
                    ? "border-2 border-black bg-black text-white font-bold"
                    : "border border-neutral-300 bg-white text-neutral-800 hover:border-black font-normal"
                }`}
              >
                <span>{opt.label}</span>
                {opt.priceDiff > 0 && (
                  <span className={`ml-1 text-[11px] ${isSelected ? "text-neutral-200" : "text-neutral-500"}`}>
                    (+Rs.{opt.priceDiff.toLocaleString()})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. EXPEDITE ORDER */}
      <div className="pt-0.5">
        <label className="border border-neutral-300 bg-white p-3 flex items-center gap-3 cursor-pointer select-none hover:border-black transition-colors rounded-none">
          <input
            type="checkbox"
            checked={expedite}
            onChange={(e) => setExpedite(e.target.checked)}
            className="h-4 w-4 rounded-none border-neutral-400 accent-black cursor-pointer"
          />
          <span className="text-xs text-black font-medium tracking-normal">
            Express-Shipping (5-6 Working Days) [+PKR 8,000]
          </span>
        </label>
      </div>

      {/* 5. YOU MAY ALSO ADD (Slip options) */}
      <div className="pt-1">
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.05em] text-black">
          You may also add:
        </div>
        <div className="space-y-1.5">
          {SLIP_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-900 select-none"
            >
              <input
                type="radio"
                name="slip_option"
                checked={slip === opt}
                onChange={() => setSlip(opt)}
                className="h-3.5 w-3.5 accent-black cursor-pointer"
              />
              <span className={slip === opt ? "font-semibold text-black" : "font-normal text-neutral-700"}>
                {opt}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 6. Quantity Stepper */}
      <div className="pt-2">
        <div className="flex w-[120px] items-center justify-between border border-neutral-300 rounded-none px-3 py-1 bg-white">
          <button
            type="button"
            aria-label="Reduce quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-6 w-6 place-items-center text-neutral-600 hover:text-black transition-colors"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs font-semibold text-black" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => q + 1)}
            className="grid h-6 w-6 place-items-center text-neutral-600 hover:text-black transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 7. Action Buttons */}
      <div className="space-y-2 pt-2">
        {/* ADD TO CART */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full bg-[#111111] hover:bg-neutral-800 text-white py-3.5 text-xs font-extrabold uppercase tracking-[0.25em] transition-colors shadow-none rounded-none cursor-pointer"
        >
          {addedNotice ? "✓ ADDED TO BAG" : "ADD TO CART"}
        </button>

        {/* BUY IT NOW */}
        <button
          type="button"
          onClick={handleBuyNow}
          className="w-full bg-white hover:bg-neutral-100 text-black border border-black py-3.5 text-xs font-extrabold uppercase tracking-[0.25em] transition-colors shadow-none rounded-none cursor-pointer"
        >
          BUY IT NOW
        </button>

        {/* We accept Google Pay / Apple Pay badges */}
        <div className="flex items-center justify-end gap-2 text-xs text-neutral-700 py-1 font-serif">
          <span className="text-[12px] font-normal text-neutral-600">We accept</span>
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

        {/* CHAT WITH FASHION CONSULTANT - Vibrant Green */}
        <a
          href={`https://wa.me/923310397865?text=${encodeURIComponent(
            `Hi Sillhouete, I am interested in ${product.title} (SKU: ${dynamicSku}, Size: ${size}, Dupatta: ${dupatta}). Could you please share more details?`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 bg-[#00a63f] hover:bg-[#008f36] text-white py-3.5 text-xs font-bold uppercase tracking-wider transition-colors shadow-none rounded-none cursor-pointer"
        >
          <MessageCircle className="h-4 w-4 fill-white text-white" />
          <span>CHAT WITH FASHION CONSULTANT</span>
        </a>
      </div>
    </div>
  );
}
