"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, Ruler, X } from "lucide-react";
import type { Product } from "@/types";
import { useStore } from "@/components/providers/StoreProvider";
import { SITE } from "@/data/site";

const SIZES = ["XS", "S", "M", "L", "XL"];
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

  const dupattaValues = useMemo(() => optionValues(product, "option2", product.dupattaOptions), [product]);
  const adOnValues = useMemo(() => optionValues(product, "option3", product.adOnOptions), [product]);

  const availableSizes = useMemo(() => {
    return product.sizes?.length ? product.sizes : SIZES;
  }, [product.sizes]);

  const [size, setSize] = useState(() => (product.sizes?.length ? product.sizes[0] : "XS"));
  const [dupatta, setDupatta] = useState("None");
  const [adOn, setAdOn] = useState("None");
  const [expedite, setExpedite] = useState(false);
  const [extra, setExtra] = useState(SAME_AS_SAMPLE);
  const [qty, setQty] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [customSizeNote, setCustomSizeNote] = useState("");

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
    customSizeNote: size.toLowerCase().includes("custom") && customSizeNote.trim() ? customSizeNote.trim() : undefined,
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
    `h-[36px] min-w-[48px] px-3.5 text-[13px] transition-colors cursor-pointer flex items-center justify-center border ${
      selected ? "border-black text-black font-bold" : "border-neutral-300 text-neutral-600 hover:border-black"
    }`;

  const isSleeveless = product.description?.toLowerCase().includes("sleeveless") || product.handle === "camilla";

  return (
    <div className="space-y-4">
      {/* Price matching live site */}
      <div className="flex items-baseline gap-3">
        <span className="text-[20px] font-bold text-black font-sans">{formatPrice(unitPrice)}</span>
        {product.originalPrice && (
          <span className="text-sm text-neutral-400 line-through font-sans">{formatPrice(product.originalPrice)}</span>
        )}
      </div>

      {children}

      {/* SIZE */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-black font-sans">
            S I Z E
          </span>
          <button
            type="button"
            onClick={() => setShowSizeChart(true)}
            className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-neutral-600 hover:text-black underline cursor-pointer"
          >
            <Ruler className="h-3.5 w-3.5" />
            Size Guide
          </button>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {availableSizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              aria-pressed={size === s}
              className={`${optionButton(size === s)} font-sans`}
            >
              {s}
            </button>
          ))}
        </div>
        {size.toLowerCase().includes("custom") && (
          <div className="mt-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-black">
                Custom Measurements / Sizing Note
              </label>
              <span className="text-[10px] text-neutral-500">Optional or provide your fit</span>
            </div>
            <textarea
              rows={2}
              value={customSizeNote}
              onChange={(e) => setCustomSizeNote(e.target.value)}
              placeholder="e.g. Chest: 36, Waist: 30, Hips: 40, Shirt Length: 42, Shoulder: 15..."
              className="w-full text-xs p-2.5 border border-neutral-300 rounded outline-none focus:border-black bg-white resize-none"
            />
            <p className="text-[11px] text-neutral-500">
              Your custom measurements will be attached directly to your order and tailored by our atelier.
            </p>
          </div>
        )}
      </div>

      {/* DUPATTA — only for products that really have the option */}
      {dupattaValues.length > 0 && (
        <div>
          <div className="mb-2 text-[12px] font-bold uppercase tracking-wider text-black font-sans">Dupatta</div>
          <div className="flex flex-wrap gap-2.5">
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
          <div className="mb-2 text-[12px] font-bold uppercase tracking-wider text-black font-sans">Ad Ons</div>
          <div className="flex flex-wrap gap-2.5">
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

      {/* EXPEDITE ORDER - Exactly matching live screenshot */}
      <div className="pt-1">
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-black font-sans">
          E X P E D I T E &nbsp; O R D E R
        </div>
        <label className="flex items-center gap-3 border border-neutral-300 bg-white px-3.5 py-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={expedite}
            onChange={(e) => setExpedite(e.target.checked)}
            className="h-4 w-4 rounded-none accent-black cursor-pointer"
          />
          <span className="text-[12px] font-bold uppercase tracking-wide text-black font-sans">
            EXPRESS - SHIPPING (5 - 6 WORKING DAYS) [+PKR {EXPEDITE_FEE}]
          </span>
        </label>
      </div>

      {/* YOU MAY ALSO ADD - Only for sleeveless dresses like Camilla */}
      {isSleeveless && (
        <div className="pt-1">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-black font-sans">
            You may also add:
          </div>
          <div className="space-y-2 text-[13px] font-sans">
            {[SAME_AS_SAMPLE, WITH_SLEEVES].map((opt) => (
              <label key={opt} className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="radio"
                  name="extra_option"
                  checked={extra === opt}
                  onChange={() => setExtra(opt)}
                  className="h-4 w-4 accent-black cursor-pointer"
                />
                <span className="text-[12.5px] font-bold uppercase tracking-wide text-black font-sans">
                  {opt}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Quantity matching live_top.png */}
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

      {/* 3 Full-width CTAs exactly matching Image 3 */}
      <div className="space-y-2.5 pt-2">
        {/* ADD TO CART (Solid Black, White Text) */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full bg-black hover:bg-neutral-900 py-3.5 text-center font-sans text-[13px] font-bold uppercase tracking-wider text-white transition-colors cursor-pointer"
        >
          {addedNotice ? "✓ ADDED TO CART" : "ADD TO CART"}
        </button>

        {/* BUY IT NOW (Solid Light Grey #e8e8e8, Black Text matching Image 3) */}
        <button
          type="button"
          onClick={handleBuyNow}
          className="w-full bg-[#e8e8e8] hover:bg-[#dedede] py-3.5 text-center font-sans text-[13px] font-bold uppercase tracking-wider text-black border-0 transition-colors cursor-pointer"
        >
          BUY IT NOW
        </button>

        {/* CHAT WITH FASHION CONSULTANT (Solid Green #0a8f2e with WhatsApp icon matching Image 3) */}
        <a
          href={`https://wa.me/923310397865?text=${encodeURIComponent(
            `Hi Sillhouete, I am interested in ${product.title} (SKU: ${dynamicSku}, Size: ${size}${
              !isNone(dupatta) ? `, Dupatta: ${dupatta}` : ""
            }). Could you please share more details?`,
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

        {/* Payment badges matching Image 3 */}
        <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-neutral-600 font-sans">
          <span>We accept</span>
          {/* GPay badge */}
          <span className="inline-flex items-center border border-neutral-200 px-1.5 py-0.5 bg-white text-[10px] font-bold text-black">
            GPay
          </span>
          {/* ApplePay badge */}
          <span className="inline-flex items-center border border-neutral-200 px-1.5 py-0.5 bg-white text-[10px] font-bold text-black">
            ApplePay
          </span>
        </div>
      </div>

      {/* Size Chart Modal */}
      {showSizeChart && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Size Chart"
          className="fixed inset-0 z-[120] grid place-items-center bg-black/60 backdrop-blur-[2px] p-4 animate-fade-in"
          onClick={() => setShowSizeChart(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-[680px] overflow-y-auto bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-4">
              <div>
                <span className="font-serif text-[12px] text-neutral-500 uppercase tracking-widest block">
                  Sillhouete Size Guide
                </span>
                <h3 className="font-serif text-[18px] font-bold uppercase tracking-wider text-black">
                  Standard Measurement Chart
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

            {product.customSizeImage ? (
              <div className="py-2 space-y-3">
                <div className="relative mx-auto max-w-full overflow-hidden rounded border border-neutral-200 bg-neutral-50 p-2">
                  <Image
                    src={product.customSizeImage}
                    alt={`${product.title} Size Chart`}
                    width={800}
                    height={1000}
                    className="w-full h-auto object-contain mx-auto"
                  />
                </div>
                <p className="text-center text-xs text-neutral-500">
                  Custom size chart &amp; guidelines for {product.title}.
                </p>
              </div>
            ) : (
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
                  Size Chart
                </div>
                <div className="text-[12px] font-bold uppercase tracking-wider text-neutral-800">
                  {product.title.toUpperCase()} &bull; {product.sku || "STANDARD SIZE"}
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
