"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Ruler, Check, MessageCircle } from "lucide-react";
import type { Product } from "@/types";
import { useStore } from "@/components/providers/StoreProvider";

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "Custom Size"];

const DEFAULT_DUPATTA_OPTIONS = [
  { label: "None", priceDiff: 0 },
  { label: "Organza Ruffled dupatta", priceDiff: 15000 },
  { label: "Organza dupatta with pearl spray", priceDiff: 10000 },
];

const AD_ON_OPTIONS = [
  { label: "None", priceDiff: 0 },
  { label: "Grip Head scarf", priceDiff: 4000 },
];

const SLIP_OPTIONS = [
  "SELECT ONE",
  "SLIP WITH SLEEVES",
  "SLIP WITHOUT SLEEVES",
];

export default function AddToCart({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart, setCartOpen, formatPrice } = useStore();

  const availableSizes =
    product.sizes && product.sizes.length ? product.sizes : DEFAULT_SIZES;

  const [size, setSize] = useState(availableSizes[0]);
  const [dupatta, setDupatta] = useState<string>("None");
  const [adOn, setAdOn] = useState<string>("None");
  const [expedite, setExpedite] = useState<boolean>(false);
  const [slip, setSlip] = useState<string>("SELECT ONE");
  const [qty, setQty] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  // Compute live unit price based on selected options and variants
  const calculatedUnitPrice = useMemo(() => {
    let base = product.price;

    // Check if product has explicit variants matching size and dupatta
    if (product.variants && product.variants.length > 0) {
      const match = product.variants.find((v) => {
        const opt1Match = !v.option1 || v.option1.toLowerCase() === size.toLowerCase();
        const opt2Match =
          !v.option2 ||
          v.option2.toLowerCase() === dupatta.toLowerCase() ||
          (dupatta === "None" && v.option2.toLowerCase().includes("none"));
        return opt1Match && opt2Match;
      });
      if (match && match.price) {
        base = match.price;
      } else {
        // Fallback to dupatta price diff
        const d = DEFAULT_DUPATTA_OPTIONS.find((opt) => opt.label === dupatta);
        if (d) base += d.priceDiff;
      }
    } else {
      const d = DEFAULT_DUPATTA_OPTIONS.find((opt) => opt.label === dupatta);
      if (d) base += d.priceDiff;
    }

    // Add Ad-ons
    const a = AD_ON_OPTIONS.find((opt) => opt.label === adOn);
    if (a) base += a.priceDiff;

    // Expedite shipping fee
    if (expedite) base += 8000;

    return base;
  }, [product, size, dupatta, adOn, expedite]);

  const handleAddToCart = () => {
    addToCart(product, {
      size,
      dupatta: dupatta !== "None" ? dupatta : undefined,
      adOn: adOn !== "None" ? adOn : undefined,
      expedite,
      slip: slip !== "SELECT ONE" ? slip : undefined,
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
      slip: slip !== "SELECT ONE" ? slip : undefined,
      unitPrice: calculatedUnitPrice,
      quantity: qty,
    });
    setCartOpen(false);
    router.push("/checkout");
  };

  const dynamicSku = `${product.sku || product.handle.toUpperCase()}-${size}`;

  return (
    <div className="mt-6 space-y-6">
      {/* Live calculated price indicator if add-ons selected */}
      {(dupatta !== "None" || adOn !== "None" || expedite) && (
        <div className="rounded border border-[#e5a83b]/30 bg-[#fffdf9] p-3 text-xs">
          <span className="font-semibold text-black">Configured Item Price: </span>
          <span className="text-base font-bold text-black">{formatPrice(calculatedUnitPrice)}</span>
          <span className="ml-2 text-black/60">(Includes selected custom options)</span>
        </div>
      )}

      {/* 1. SIZE Selector */}
      <fieldset>
        <div className="mb-2.5 flex items-center justify-between">
          <legend className="text-xs uppercase tracking-wider font-semibold text-black">
            Size: <span className="font-normal text-black/70">{size}</span>
          </legend>
          <button
            type="button"
            onClick={() => setShowSizeGuide(true)}
            className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-black underline underline-offset-4 hover:text-black/70"
          >
            <Ruler className="h-3 w-3" />
            Size Guide
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((s) => (
            <label
              key={s}
              className={`cursor-pointer border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all select-none ${
                size === s
                  ? "border-black bg-black text-white"
                  : "border-black/20 bg-white text-black hover:border-black"
              }`}
            >
              <input
                type="radio"
                name="size"
                value={s}
                checked={size === s}
                onChange={() => setSize(s)}
                className="sr-only"
              />
              {s}
            </label>
          ))}
        </div>
      </fieldset>

      {/* 2. DUPATTA Selector (Real Sillhouete option) */}
      <fieldset>
        <legend className="mb-2.5 text-xs uppercase tracking-wider font-semibold text-black">
          Dupatta: <span className="font-normal text-black/70">{dupatta}</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_DUPATTA_OPTIONS.map((opt) => (
            <label
              key={opt.label}
              className={`cursor-pointer border px-3.5 py-2 text-xs uppercase tracking-wider transition-all select-none ${
                dupatta === opt.label
                  ? "border-black bg-black text-white font-semibold"
                  : "border-black/20 bg-white text-black hover:border-black font-normal"
              }`}
            >
              <input
                type="radio"
                name="dupatta"
                value={opt.label}
                checked={dupatta === opt.label}
                onChange={() => setDupatta(opt.label)}
                className="sr-only"
              />
              {opt.label}
              {opt.priceDiff > 0 && ` (+${formatPrice(opt.priceDiff)})`}
            </label>
          ))}
        </div>
      </fieldset>

      {/* 3. AD ONS (Grip Head Scarf) */}
      <fieldset>
        <legend className="mb-2.5 text-xs uppercase tracking-wider font-semibold text-black">
          Ad Ons: <span className="font-normal text-black/70">{adOn}</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {AD_ON_OPTIONS.map((opt) => (
            <label
              key={opt.label}
              className={`cursor-pointer border px-3.5 py-2 text-xs uppercase tracking-wider transition-all select-none ${
                adOn === opt.label
                  ? "border-black bg-black text-white font-semibold"
                  : "border-black/20 bg-white text-black hover:border-black font-normal"
              }`}
            >
              <input
                type="radio"
                name="adOn"
                value={opt.label}
                checked={adOn === opt.label}
                onChange={() => setAdOn(opt.label)}
                className="sr-only"
              />
              {opt.label}
              {opt.priceDiff > 0 && ` (+${formatPrice(opt.priceDiff)})`}
            </label>
          ))}
        </div>
      </fieldset>

      {/* 4. EXPEDITE ORDER Checkbox */}
      <div className="border border-black/15 bg-neutral-50 p-3">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={expedite}
            onChange={(e) => setExpedite(e.target.checked)}
            className="h-4 w-4 rounded border-black/30 text-black focus:ring-black"
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-black">
            Express-Shipping (5-6 Working Days) [+PKR 8,000]
          </span>
        </label>
      </div>

      {/* 5. YOU MAY ALSO ADD (Complimentary Slip Options) */}
      <fieldset className="space-y-2">
        <legend className="text-xs uppercase tracking-wider font-semibold text-black">
          You May Also Add:
        </legend>
        <div className="flex flex-col gap-2">
          {SLIP_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2.5 cursor-pointer text-xs text-black/85 select-none"
            >
              <input
                type="radio"
                name="slip"
                value={opt}
                checked={slip === opt}
                onChange={() => setSlip(opt)}
                className="h-3.5 w-3.5 border-black/40 text-black focus:ring-black"
              />
              <span className={slip === opt ? "font-semibold text-black" : ""}>
                {opt}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 6. Quantity Selector */}
      <div>
        <label className="mb-2 block text-xs uppercase tracking-wider font-semibold text-black">
          Quantity
        </label>
        <div className="flex w-fit items-center border border-black/20 bg-white">
          <button
            type="button"
            aria-label="Reduce quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-10 w-10 place-items-center hover:bg-neutral-100 transition-colors"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-12 text-center text-sm font-semibold" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => q + 1)}
            className="grid h-10 w-10 place-items-center hover:bg-neutral-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 7. Action Buttons */}
      <div className="space-y-2.5 pt-2">
        {/* ADD TO CART - Solid Black */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="btn w-full py-4 text-xs font-bold uppercase tracking-[0.25em] bg-black text-white hover:bg-black/85 transition-all shadow-sm"
        >
          {addedNotice ? "✓ Added to Bag" : "Add to Cart"}
        </button>

        {/* BUY IT NOW - Black background with white text */}
        <button
          type="button"
          onClick={handleBuyNow}
          className="btn w-full py-3.5 text-xs font-bold uppercase tracking-[0.25em] bg-black text-white hover:bg-neutral-800 transition-all border border-black shadow-sm"
        >
          Buy It Now
        </button>

        {/* Payment options accepted */}
        <div className="pt-1 text-center">
          <p className="text-[11px] text-black/60 uppercase tracking-widest">
            We accept: GPay · Apple Pay · Visa · MasterCard
          </p>
        </div>

        {/* CHAT WITH FASHION CONSULTANT - Full width vibrant green */}
        <a
          href={`https://wa.me/923310397865?text=${encodeURIComponent(
            `Hi Sillhouete, I am interested in ${product.title} (SKU: ${dynamicSku}, Size: ${size}, Dupatta: ${dupatta}). Could you please share more details?`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded bg-[#10c379] hover:bg-[#0ea666] text-white py-3.5 text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
        >
          <MessageCircle className="h-4 w-4 fill-white" />
          <span>Chat with Fashion Consultant</span>
        </a>
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowSizeGuide(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="heading text-[18px]">Size Guide (Inches)</h3>
              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                className="text-sm font-semibold hover:text-black"
              >
                ✕ Close
              </button>
            </div>
            <p className="mt-3 text-xs text-black/70">
              All measurements are in inches. Custom sizing is also available upon request.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs border border-black/10">
                <thead className="bg-neutral-100">
                  <tr className="border-b border-black/10">
                    <th className="p-2.5 font-bold">Size</th>
                    <th className="p-2.5 font-bold">Chest</th>
                    <th className="p-2.5 font-bold">Waist</th>
                    <th className="p-2.5 font-bold">Hip</th>
                    <th className="p-2.5 font-bold">Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  <tr>
                    <td className="p-2.5 font-semibold">XS</td>
                    <td className="p-2.5">34</td>
                    <td className="p-2.5">28</td>
                    <td className="p-2.5">37</td>
                    <td className="p-2.5">42</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">S</td>
                    <td className="p-2.5">36</td>
                    <td className="p-2.5">30</td>
                    <td className="p-2.5">39</td>
                    <td className="p-2.5">44</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">M</td>
                    <td className="p-2.5">39</td>
                    <td className="p-2.5">33</td>
                    <td className="p-2.5">42</td>
                    <td className="p-2.5">45</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">L</td>
                    <td className="p-2.5">42</td>
                    <td className="p-2.5">36</td>
                    <td className="p-2.5">45</td>
                    <td className="p-2.5">46</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">XL</td>
                    <td className="p-2.5">45</td>
                    <td className="p-2.5">40</td>
                    <td className="p-2.5">48</td>
                    <td className="p-2.5">47</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-black/60">
              Need personalized fitting? Choose <strong>Custom Size</strong> and enter your exact measurements in the order notes at checkout, or contact us on WhatsApp (+92 331 0397865).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
