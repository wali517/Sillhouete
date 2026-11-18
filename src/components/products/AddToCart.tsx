"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, Ruler, X, Check } from "lucide-react";
import type { Product } from "@/types";
import { useStore } from "@/components/providers/StoreProvider";
import { SITE } from "@/data/site";

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL"];
const EXPEDITE_FEE = 8000;
const SAME_AS_SAMPLE = "Same as sample";
const WITH_SLEEVES = "With sleeves";

const isNone = (v?: string | null) => !v || v.trim().toLowerCase() === "none";

function optionValues(product: Product, slot: "option2" | "option3", fallback?: string[]) {
  const fromVariants = (product.variants ?? [])
    .map((v) => v[slot])
    .filter((v): v is string => !isNone(v));
  const unique = Array.from(new Set(fromVariants));
  if (unique.length > 0) return unique;
  return (fallback ?? []).filter((v) => !isNone(v));
}

export default function AddToCart({ product, children }: { product: Product; children?: ReactNode }) {
  const router = useRouter();
  const { addToCart, setCartOpen, formatPrice } = useStore();

  const hasCustomOptions = Boolean(product.options && product.options.length > 0);
  const hasChoiceGroups = Boolean(product.choiceGroups && product.choiceGroups.length > 0);

  // 1. Dynamic Options State (Size, Dupatta, AD ONS, Color, etc.)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (product.options && product.options.length > 0) {
      product.options.forEach((opt) => {
        if (opt.values && opt.values.length > 0) {
          initial[opt.name] = opt.values[0];
        }
      });
    }
    return initial;
  });

  // 2. Dynamic Customer Add-on Choice Groups State ("You may also add:")
  const [choiceGroupSelections, setChoiceGroupSelections] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (product.choiceGroups && product.choiceGroups.length > 0) {
      product.choiceGroups.forEach((cg, idx) => {
        if (cg.choices && cg.choices.length > 0) {
          const key = `${cg.title}__${idx}`;
          initial[key] = cg.choices[0]; // e.g. "Select One" or "Same as sample"
        }
      });
    }
    return initial;
  });

  // Legacy fallback options
  const dupattaValues = useMemo(() => optionValues(product, "option2", product.dupattaOptions), [product]);
  const adOnValues = useMemo(() => optionValues(product, "option3", product.adOnOptions), [product]);
  const availableSizes = useMemo(() => {
    const list = product.sizes?.length ? [...product.sizes] : [...DEFAULT_SIZES];
    if (!list.some((s) => s.toLowerCase().includes("custom"))) {
      list.push("Custom Size");
    }
    return list;
  }, [product.sizes]);

  const [legacySize, setLegacySize] = useState(() => (product.sizes?.length ? product.sizes[0] : "XS"));
  const [legacyDupatta, setLegacyDupatta] = useState("None");
  const [legacyAdOn, setLegacyAdOn] = useState("None");
  const [expedite, setExpedite] = useState(false);
  const [legacyExtra, setLegacyExtra] = useState(SAME_AS_SAMPLE);
  const [qty, setQty] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [customSizeNote, setCustomSizeNote] = useState("");

  // Current active size identifier
  const activeSize = hasCustomOptions
    ? selectedOptions["Size"] || selectedOptions["size"] || legacySize
    : legacySize;

  const activeDupatta = hasCustomOptions
    ? selectedOptions["Dupatta"] || selectedOptions["dupatta"] || legacyDupatta
    : legacyDupatta;

  const activeAdOn = hasCustomOptions
    ? selectedOptions["AD ONS"] || selectedOptions["Ad Ons"] || selectedOptions["ad on"] || legacyAdOn
    : legacyAdOn;

  // 3. Variant Matcher
  const matchedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;

    if (hasCustomOptions) {
      // Find matching variant based on attributes
      const found = product.variants.find((v) => {
        if (v.attributes && v.attributes.length > 0) {
          return v.attributes.every(
            (attr) => (selectedOptions[attr.name] || "").toLowerCase() === attr.value.toLowerCase()
          );
        }
        // Match by option1, option2, option3
        const s = selectedOptions["Size"] || selectedOptions["size"] || legacySize;
        const d = selectedOptions["Dupatta"] || selectedOptions["dupatta"] || legacyDupatta;
        const a = selectedOptions["AD ONS"] || selectedOptions["Ad Ons"] || legacyAdOn;
        return (
          (!v.option1 || v.option1.toLowerCase() === s.toLowerCase()) &&
          (isNone(v.option2) ? isNone(d) : (v.option2 ?? "").toLowerCase() === d.toLowerCase()) &&
          (isNone(v.option3) ? isNone(a) : (v.option3 ?? "").toLowerCase() === a.toLowerCase())
        );
      });
      if (found) return found;
    }

    // Legacy matching
    return (
      product.variants.find(
        (v) =>
          (!v.option1 || v.option1.toLowerCase() === legacySize.toLowerCase()) &&
          (isNone(v.option2) ? isNone(legacyDupatta) : (v.option2 ?? "").toLowerCase() === legacyDupatta.toLowerCase()) &&
          (isNone(v.option3) ? isNone(legacyAdOn) : (v.option3 ?? "").toLowerCase() === legacyAdOn.toLowerCase())
      ) || null
    );
  }, [product.variants, hasCustomOptions, selectedOptions, legacySize, legacyDupatta, legacyAdOn]);

  // Pricing Calculation
  const basePrice = matchedVariant?.salePrice || matchedVariant?.price || product.price;
  const originalComparePrice = matchedVariant?.salePrice
    ? matchedVariant.price
    : product.originalPrice || undefined;

  const unitPrice = basePrice + (expedite ? EXPEDITE_FEE : 0);

  // Dynamic SKU
  const currentSku = matchedVariant?.sku || `${product.sku || product.handle.toUpperCase()}-${activeSize}`;

  // In Stock check
  const isItemInStock =
    matchedVariant?.stock !== undefined ? matchedVariant.stock > 0 : product.inStock !== false;

  // Derive slip choice from choiceGroups or legacy extra
  const derivedSlipChoice = useMemo(() => {
    if (hasChoiceGroups) {
      const keys = Object.keys(choiceGroupSelections);
      const values = Object.values(choiceGroupSelections).filter(
        (v) => v && v.toLowerCase() !== "select one" && v.toLowerCase() !== "none"
      );
      return values.join(" | ");
    }
    return legacyExtra === WITH_SLEEVES ? WITH_SLEEVES : undefined;
  }, [hasChoiceGroups, choiceGroupSelections, legacyExtra]);

  const payload = () => ({
    size: activeSize,
    dupatta: !isNone(activeDupatta) ? activeDupatta : undefined,
    adOn: !isNone(activeAdOn) ? activeAdOn : undefined,
    expedite,
    slip: derivedSlipChoice || undefined,
    choiceGroupSelections: hasChoiceGroups ? choiceGroupSelections : undefined,
    customSizeNote:
      activeSize.toLowerCase().includes("custom") && customSizeNote.trim()
        ? customSizeNote.trim()
        : undefined,
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

  const optionButton = (selected: boolean) =>
    `min-w-[52px] border px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.1em] transition cursor-pointer flex items-center justify-center select-none ${
      selected
        ? "border-2 border-black text-black font-bold shadow-2xs"
        : "border-neutral-300 text-neutral-700 hover:border-black"
    }`;

  const isSleeveless =
    product.description?.toLowerCase().includes("sleeveless");

  return (
    <div className="space-y-4">
      {/* Price matching live luxury store */}
      <div className="flex items-baseline gap-3">
        <span className="text-[22px] font-bold text-black font-sans">{formatPrice(unitPrice)}</span>
        {originalComparePrice && originalComparePrice > unitPrice && (
          <span className="text-sm text-neutral-400 line-through font-sans">
            {formatPrice(originalComparePrice)}
          </span>
        )}
        {!isItemInStock && (
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded">
            Sold Out
          </span>
        )}
      </div>

      {children}

      {/* ──────────────── DYNAMIC VARIANT OPTIONS (Size, Dupatta, AD ONS, Color, etc.) ──────────────── */}
      {hasCustomOptions ? (
        <div className="space-y-4">
          {product.options!.map((opt, optIdx) => {
            const isSize = opt.name.toLowerCase() === "size";
            const currentSelected = selectedOptions[opt.name] || opt.values[0];

            return (
              <div key={`${opt.name}-${optIdx}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-black font-sans">
                    {opt.name}
                  </span>
                  {isSize && (
                    <button
                      type="button"
                      onClick={() => setShowSizeChart(true)}
                      className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-wider text-black font-semibold hover:underline cursor-pointer"
                    >
                      <Ruler className="h-4 w-4" />
                      Size Guide
                    </button>
                  )}
                </div>

                {(() => {
                  const sizeOptionsList = isSize && !opt.values.some((v) => v.toLowerCase().includes("custom"))
                    ? [...opt.values, "Custom Size"]
                    : opt.values;

                  return (
                    <div className="flex flex-wrap gap-2">
                      {sizeOptionsList.map((val, valIdx) => {
                        const isSelected = currentSelected === val;
                        return (
                          <button
                            key={`${val}-${valIdx}`}
                            type="button"
                            onClick={() =>
                              setSelectedOptions((prev) => ({ ...prev, [opt.name]: val }))
                            }
                            aria-pressed={isSelected}
                            className={`${optionButton(isSelected)} font-sans`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {isSize && currentSelected.toLowerCase().includes("custom") && (
                  <div className="mt-2.5 p-3 bg-neutral-50 border border-neutral-200 rounded space-y-2 text-xs">
                    <label className="font-bold uppercase tracking-wider text-black">
                      Custom Measurements / Sizing Fit
                    </label>
                    <textarea
                      rows={3}
                      value={customSizeNote}
                      onChange={(e) => setCustomSizeNote(e.target.value)}
                      placeholder="Please enter your custom measurements (e.g. Chest, Waist, Hips, Shirt Length, Sleeves, Shoulders)..."
                      className="w-full text-xs p-2.5 border border-neutral-300 rounded outline-none focus:border-black bg-white"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Legacy Size, Dupatta, Ad-Ons fallback */
        <div className="space-y-4">
          {/* SIZE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-black font-sans">
                Size
              </span>
              <button
                type="button"
                onClick={() => setShowSizeChart(true)}
                className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-wider text-black font-semibold hover:underline cursor-pointer"
              >
                <Ruler className="h-4 w-4" />
                Size Guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setLegacySize(s)}
                  aria-pressed={legacySize === s}
                  className={`${optionButton(legacySize === s)} font-sans`}
                >
                  {s}
                </button>
              ))}
            </div>
            {legacySize.toLowerCase().includes("custom") && (
              <div className="mt-2.5 p-3 bg-neutral-50 border border-neutral-200 rounded space-y-2 text-xs">
                <label className="font-bold uppercase tracking-wider text-black">
                  Custom Measurements
                </label>
                <textarea
                  rows={2}
                  value={customSizeNote}
                  onChange={(e) => setCustomSizeNote(e.target.value)}
                  placeholder="Chest, Waist, Hips, Shirt Length, Shoulder..."
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded outline-none focus:border-black bg-white"
                />
              </div>
            )}
          </div>

          {/* DUPATTA */}
          {dupattaValues.length > 0 && (
            <div className="space-y-2">
              <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-black font-sans">
                Dupatta
              </span>
              <div className="flex flex-wrap gap-2">
                {["None", ...dupattaValues].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLegacyDupatta(opt)}
                    aria-pressed={legacyDupatta === opt}
                    className={`${optionButton(legacyDupatta === opt)} font-sans`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AD ONS */}
          {adOnValues.length > 0 && (
            <div className="space-y-2">
              <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-black font-sans">
                Ad Ons
              </span>
              <div className="flex flex-wrap gap-2">
                {["None", ...adOnValues].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLegacyAdOn(opt)}
                    aria-pressed={legacyAdOn === opt}
                    className={`${optionButton(legacyAdOn === opt)} font-sans`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────── CUSTOMER ADD-ON CHOICE GROUPS ("You may also add:") ──────────────── */}
      {hasChoiceGroups ? (
        <div className="space-y-4 pt-1">
          {product.choiceGroups!.map((cg, groupIdx) => {
            const groupKey = `${cg.title}__${groupIdx}`;
            const currentSelected =
              choiceGroupSelections[groupKey] || choiceGroupSelections[cg.title] || cg.choices[0];
            return (
              <div key={groupKey} className="space-y-2">
                <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-black font-sans">
                  {cg.title}
                </p>
                <div className="space-y-2 text-[13.5px] font-sans">
                  {cg.choices.map((choice, choiceIdx) => (
                    <label
                      key={`${choice}-${choiceIdx}`}
                      className="flex cursor-pointer items-center gap-3 select-none text-neutral-800 hover:text-black"
                    >
                      <input
                        type="radio"
                        name={`choice-group-${groupIdx}`}
                        value={choice}
                        checked={currentSelected === choice}
                        onChange={() =>
                          setChoiceGroupSelections((prev) => ({
                            ...prev,
                            [groupKey]: choice,
                          }))
                        }
                        className="h-4 w-4 accent-black cursor-pointer"
                      />
                      <span className={choice.toLowerCase() === "select one" ? "text-neutral-500 font-normal" : "font-medium"}>
                        {choice}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : isSleeveless ? (
        /* Legacy sleeveless slips fallback */
        <div className="space-y-2 pt-1">
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-black font-sans">
            You may also add:
          </p>
          <div className="space-y-2 text-[13.5px] font-sans">
            {[SAME_AS_SAMPLE, WITH_SLEEVES].map((opt) => (
              <label key={opt} className="flex cursor-pointer items-center gap-3 select-none text-neutral-800">
                <input
                  type="radio"
                  name="extra_option"
                  checked={legacyExtra === opt}
                  onChange={() => setLegacyExtra(opt)}
                  className="h-4 w-4 accent-black cursor-pointer"
                />
                <span className="font-medium">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {/* ──────────────── EXPEDITE ORDER ──────────────── */}
      {product.expressAllowed !== false && (
        <div className="space-y-2 pt-1">
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-black font-sans">
            Expedite Order
          </p>
          <label className="flex cursor-pointer items-center gap-3.5 border border-neutral-300 bg-white px-4 py-3.5 select-none hover:border-black transition">
            <input
              type="checkbox"
              checked={expedite}
              onChange={(e) => setExpedite(e.target.checked)}
              className="h-4 w-4 accent-black cursor-pointer rounded-none"
            />
            <span className="text-[12px] font-bold uppercase tracking-wider text-black font-sans">
              Express-shipping (5-6 working days) [+Rs.8,000]
            </span>
          </label>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="flex items-center gap-3 pt-2">
        <div className="inline-flex items-center border border-neutral-300 rounded-full px-2 py-1">
          <button
            type="button"
            aria-label="Reduce quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-6 w-6 place-items-center text-neutral-600 hover:text-black cursor-pointer"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-8 text-center text-[13px] font-bold text-black font-sans" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => q + 1)}
            className="grid h-6 w-6 place-items-center text-neutral-600 hover:text-black cursor-pointer"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          disabled={!isItemInStock}
          onClick={handleAddToCart}
          className="w-full bg-black hover:bg-neutral-900 py-3.5 text-center font-sans text-[13px] font-bold uppercase tracking-wider text-white transition-colors cursor-pointer disabled:opacity-40"
        >
          {addedNotice ? "✓ ADDED TO CART" : !isItemInStock ? "SOLD OUT" : "ADD TO CART"}
        </button>

        <button
          type="button"
          disabled={!isItemInStock}
          onClick={handleBuyNow}
          className="w-full bg-[#e8e8e8] hover:bg-[#dedede] py-3.5 text-center font-sans text-[13px] font-bold uppercase tracking-wider text-black border-0 transition-colors cursor-pointer disabled:opacity-40"
        >
          BUY IT NOW
        </button>

        {/* WhatsApp Chat button */}
        <a
          href={`https://wa.me/923310397865?text=${encodeURIComponent(
            `Hi Sillhouete, I am interested in ${product.title} (${currentSku}, ${activeSize}). Could you please share more details?`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 w-full bg-[#0a8f2e] hover:bg-[#087a27] text-white py-3.5 text-center font-sans text-[13px] font-bold uppercase tracking-wider border-0 transition-colors cursor-pointer"
        >
          <svg className="h-4.5 w-4.5 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.693.076-1.996-.464-1.667-.69-2.73-2.39-2.813-2.501-.083-.11-1.328-1.767-1.328-3.37 0-1.603.837-2.39 1.135-2.716.298-.327.65-.409.867-.409.217 0 .434.002.625.011.201.01.47-.077.734.558.274.66.936 2.288.936 2.288s.078.156.012.333c-.066.177-.145.289-.289.456-.145.167-.305.372-.435.5-.145.144-.297.3-.128.589.17.29 1.054 1.74 2.264 2.817 1.558 1.388 2.87 1.818 3.277 2.02.408.201.646.168.887-.11.242-.277 1.036-1.207 1.313-1.623.276-.416.552-.347.93-.207.378.14 2.393 1.127 2.802 1.332.409.205.681.307.781.478.1.171.1.992-.044 1.397z" />
          </svg>
          <span>CHAT WITH FASHION CONSULTANT</span>
        </a>

        {/* Payment Badges */}
        <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-neutral-600 font-sans">
          <span>We accept</span>
          <span className="inline-flex items-center border border-neutral-200 px-1.5 py-0.5 bg-white text-[10px] font-bold text-black">
            GPay
          </span>
          <span className="inline-flex items-center border border-neutral-200 px-1.5 py-0.5 bg-white text-[10px] font-bold text-black">
            ApplePay
          </span>
        </div>
      </div>

      {/* ──────────────── SIZE CHART MODAL ──────────────── */}
      {showSizeChart && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Size Chart"
          className="fixed inset-0 z-120 grid place-items-center bg-black/60 backdrop-blur-[2px] p-4 animate-fade-in"
          onClick={() => setShowSizeChart(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-[680px] overflow-y-auto bg-white p-6 shadow-2xl rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-4">
              <div>
                <span className="font-serif text-[12px] text-neutral-500 uppercase tracking-widest block">
                  Sillhouete Size Guide
                </span>
                <h3 className="font-serif text-[18px] font-bold uppercase tracking-wider text-black">
                  Measurement Chart
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-black cursor-pointer transition-colors"
                aria-label="Close size chart"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {product.sizeChartImage || product.customSizeImage ? (
              <div className="py-2 space-y-3">
                <div className="relative mx-auto max-w-full overflow-hidden rounded border border-neutral-200 bg-neutral-50 p-2">
                  <Image
                    src={product.sizeChartImage || product.customSizeImage!}
                    alt={`${product.title} Size Chart`}
                    width={800}
                    height={1000}
                    className="w-full h-auto object-contain mx-auto"
                  />
                </div>
                <p className="text-center text-xs text-neutral-500">
                  Custom size chart for {product.title}.
                </p>
              </div>
            ) : (
              /* Standard Sillhouete Chart */
              <div className="space-y-4 text-center font-sans">
                <div className="flex items-center justify-center py-1">
                  <Image
                    src={SITE.logo}
                    alt="Sillhouete"
                    width={150}
                    height={48}
                    className="h-9 w-auto object-contain"
                  />
                </div>

                <div className="bg-black text-white py-1.5 text-[14px] font-bold uppercase tracking-wider">
                  Standard Measurement Chart (Inches)
                </div>
                <div className="text-[12px] font-bold uppercase tracking-wider text-neutral-800">
                  {product.title.toUpperCase()} &bull; {currentSku}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-neutral-300 text-[12px]">
                    <thead>
                      <tr className="bg-neutral-100 text-black font-bold">
                        <th className="border border-neutral-300 px-3 py-2 text-left">Details</th>
                        <th className="border border-neutral-300 px-3 py-2">Ex Small</th>
                        <th className="border border-neutral-300 px-3 py-2">Small</th>
                        <th className="border border-neutral-300 px-3 py-2">Medium</th>
                        <th className="border border-neutral-300 px-3 py-2">Large</th>
                        <th className="border border-neutral-300 px-3 py-2">Ex Large</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-neutral-300 px-3 py-1.5 font-semibold text-left">Bust</td>
                        <td className="border border-neutral-300 px-3 py-1.5">18</td>
                        <td className="border border-neutral-300 px-3 py-1.5">19</td>
                        <td className="border border-neutral-300 px-3 py-1.5">20.5</td>
                        <td className="border border-neutral-300 px-3 py-1.5">22</td>
                        <td className="border border-neutral-300 px-3 py-1.5">23.5</td>
                      </tr>
                      <tr>
                        <td className="border border-neutral-300 px-3 py-1.5 font-semibold text-left">Hip</td>
                        <td className="border border-neutral-300 px-3 py-1.5">18.5</td>
                        <td className="border border-neutral-300 px-3 py-1.5">19.5</td>
                        <td className="border border-neutral-300 px-3 py-1.5">22</td>
                        <td className="border border-neutral-300 px-3 py-1.5">23</td>
                        <td className="border border-neutral-300 px-3 py-1.5">24.5</td>
                      </tr>
                      <tr>
                        <td className="border border-neutral-300 px-3 py-1.5 font-semibold text-left">Arm Hole</td>
                        <td className="border border-neutral-300 px-3 py-1.5">8</td>
                        <td className="border border-neutral-300 px-3 py-1.5">8.5</td>
                        <td className="border border-neutral-300 px-3 py-1.5">9.5</td>
                        <td className="border border-neutral-300 px-3 py-1.5">10.5</td>
                        <td className="border border-neutral-300 px-3 py-1.5">12</td>
                      </tr>
                      <tr>
                        <td className="border border-neutral-300 px-3 py-1.5 font-semibold text-left">Shirt Length</td>
                        <td className="border border-neutral-300 px-3 py-1.5">56</td>
                        <td className="border border-neutral-300 px-3 py-1.5">56</td>
                        <td className="border border-neutral-300 px-3 py-1.5">56</td>
                        <td className="border border-neutral-300 px-3 py-1.5">56</td>
                        <td className="border border-neutral-300 px-3 py-1.5">56</td>
                      </tr>
                      <tr>
                        <td className="border border-neutral-300 px-3 py-1.5 font-semibold text-left">HEM</td>
                        <td className="border border-neutral-300 px-3 py-1.5">42</td>
                        <td className="border border-neutral-300 px-3 py-1.5">42</td>
                        <td className="border border-neutral-300 px-3 py-1.5">42</td>
                        <td className="border border-neutral-300 px-3 py-1.5">42</td>
                        <td className="border border-neutral-300 px-3 py-1.5">42</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-black text-white py-1.5 text-[14px] font-bold uppercase tracking-wider mt-4">
                  Trouser Size
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-neutral-300 text-[12px]">
                    <thead>
                      <tr className="bg-neutral-100 text-black font-bold">
                        <th className="border border-neutral-300 px-3 py-2 text-left">Details</th>
                        <th className="border border-neutral-300 px-3 py-2">Ex Small</th>
                        <th className="border border-neutral-300 px-3 py-2">Small</th>
                        <th className="border border-neutral-300 px-3 py-2">Medium</th>
                        <th className="border border-neutral-300 px-3 py-2">Large</th>
                        <th className="border border-neutral-300 px-3 py-2">Ex Large</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-neutral-300 px-3 py-1.5 font-semibold text-left">Waist</td>
                        <td className="border border-neutral-300 px-3 py-1.5">14</td>
                        <td className="border border-neutral-300 px-3 py-1.5">15</td>
                        <td className="border border-neutral-300 px-3 py-1.5">17</td>
                        <td className="border border-neutral-300 px-3 py-1.5">19</td>
                        <td className="border border-neutral-300 px-3 py-1.5">19.5</td>
                      </tr>
                      <tr>
                        <td className="border border-neutral-300 px-3 py-1.5 font-semibold text-left">Sharara Length</td>
                        <td className="border border-neutral-300 px-3 py-1.5">45</td>
                        <td className="border border-neutral-300 px-3 py-1.5">45</td>
                        <td className="border border-neutral-300 px-3 py-1.5">45</td>
                        <td className="border border-neutral-300 px-3 py-1.5">46</td>
                        <td className="border border-neutral-300 px-3 py-1.5">46</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
