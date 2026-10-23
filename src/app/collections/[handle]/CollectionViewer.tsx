"use client";

import { useState, useMemo, useEffect } from "react";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/types";
import { SlidersHorizontal, X, ChevronDown, RotateCcw } from "lucide-react";
import { formatPrice } from "@/lib/format";

type SortOption =
  | "relevant"
  | "featured"
  | "best-selling"
  | "price-asc"
  | "price-desc"
  | "title-asc"
  | "title-desc"
  | "newest";

const COLOR_OPTIONS: { name: string; hex: string; isMulti?: boolean }[] = [
  { name: "Beige", hex: "#e2d5b8" },
  { name: "Black", hex: "#000000" },
  { name: "Blue", hex: "#0057b7" },
  { name: "Gold", hex: "#caa135" },
  { name: "Gray", hex: "#777777" },
  { name: "Green", hex: "#16a34a" },
  { name: "Multicolor", hex: "#ffffff", isMulti: true },
  { name: "Orange", hex: "#f97316" },
  { name: "Pink", hex: "#f4a6b8" },
  { name: "Red", hex: "#e11d48" },
  { name: "Silver", hex: "#c5c7cb" },
  { name: "White", hex: "#ffffff" },
];

const SIZE_OPTIONS = [
  { label: "Medium (M)", key: "M" },
  { label: "0", key: "0" },
  { label: "Small (S)", key: "S" },
  { label: "Large (L)", key: "L" },
  { label: "Extra Large (XL)", key: "XL" },
  { label: "Custom Size", key: "Custom Size" },
];

const DRESS_STYLE_OPTIONS = [
  { label: "A-line", key: "a-line" },
  { label: "Other", key: "other" },
  { label: "Maxi", key: "maxi" },
  { label: "Pishwas", key: "pishwas" },
  { label: "Sharara", key: "sharara" },
  { label: "Gharara", key: "gharara" },
];

export default function CollectionViewer({
  title,
  initialProducts,
  isSalePage = false,
}: {
  title: string;
  initialProducts: Product[];
  isSalePage?: boolean;
}) {
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);

  useEffect(() => {
    // Fetch live products from DB in case admin created or edited items
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.products && Array.isArray(data.products)) {
          // Merge newly created products from admin into the list
          const existingIds = new Set(initialProducts.map((p) => p.id));
          const newFromAdmin = data.products.filter((p: Product) => !existingIds.has(p.id));
          if (newFromAdmin.length > 0) {
            setProductsList([...newFromAdmin, ...initialProducts]);
          }
        }
      })
      .catch(() => {});
  }, [initialProducts]);

  // Sort state
  const [sort, setSort] = useState<SortOption>(isSalePage ? "featured" : "relevant");

  // Filters state
  const [maxPrice, setMaxPrice] = useState<number>(464165);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Accordion open states (default closed, click to open, compact spacing)
  const [openSections, setOpenSections] = useState({
    price: false,
    size: false,
    color: false,
    dressStyle: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const toggleSize = (sizeKey: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeKey) ? prev.filter((s) => s !== sizeKey) : [...prev, sizeKey]
    );
  };

  const toggleStyle = (styleKey: string) => {
    setSelectedStyles((prev) =>
      prev.includes(styleKey) ? prev.filter((s) => s !== styleKey) : [...prev, styleKey]
    );
  };

  const clearAllFilters = () => {
    setMaxPrice(464165);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedStyles([]);
  };

  const hasActiveFilters =
    maxPrice < 464165 ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    selectedStyles.length > 0;

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (filterDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [filterDrawerOpen]);

  // Dynamic counts for sizes
  const sizeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const opt of SIZE_OPTIONS) {
      counts[opt.key] = 0;
    }
    for (const p of initialProducts) {
      const sizes = p.sizes || [];
      for (const opt of SIZE_OPTIONS) {
        if (opt.key === "0") {
          // Default variant count
          counts["0"] += 1;
        } else if (
          sizes.some((s) => s.toLowerCase() === opt.key.toLowerCase()) ||
          opt.key === "Custom Size"
        ) {
          counts[opt.key] += 1;
        }
      }
    }
    return counts;
  }, [initialProducts]);

  // Dynamic counts for styles
  const styleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of DRESS_STYLE_OPTIONS) {
      counts[s.key] = 0;
    }
    for (const p of initialProducts) {
      const text = `${p.title} ${p.description || ""} ${p.category || ""}`.toLowerCase();
      for (const s of DRESS_STYLE_OPTIONS) {
        if (s.key === "other") {
          counts[s.key] += 1;
        } else if (text.includes(s.key)) {
          counts[s.key] += 1;
        }
      }
    }
    return counts;
  }, [initialProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      // Price
      if (p.price > maxPrice) return false;

      // Color filter
      if (selectedColors.length > 0) {
        const textToSearch = `${p.title} ${p.description || ""} ${p.color || ""}`.toLowerCase();
        const matchesAnyColor = selectedColors.some((c) =>
          textToSearch.includes(c.toLowerCase())
        );
        if (!matchesAnyColor) return false;
      }

      // Size filter
      if (selectedSizes.length > 0) {
        const productSizes = p.sizes || [];
        const matchesSize = selectedSizes.some(
          (s) =>
            s === "0" ||
            s === "Custom Size" ||
            productSizes.some((ps) => ps.toLowerCase() === s.toLowerCase())
        );
        if (!matchesSize) return false;
      }

      // Style filter
      if (selectedStyles.length > 0) {
        const text = `${p.title} ${p.description || ""} ${p.category || ""}`.toLowerCase();
        const matchesStyle = selectedStyles.some(
          (st) => st === "other" || text.includes(st)
        );
        if (!matchesStyle) return false;
      }

      return true;
    });
  }, [initialProducts, maxPrice, selectedColors, selectedSizes, selectedStyles]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sort) {
      case "price-asc":
        return list.sort((a, b) => a.price - b.price);
      case "price-desc":
        return list.sort((a, b) => b.price - a.price);
      case "title-asc":
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case "title-desc":
        return list.sort((a, b) => b.title.localeCompare(a.title));
      case "newest":
        return list.filter((p) => p.isNew).concat(list.filter((p) => !p.isNew));
      case "best-selling":
        return list.filter((p) => p.isBestSeller).concat(list.filter((p) => !p.isBestSeller));
      case "featured":
      case "relevant":
      default:
        return list;
    }
  }, [filteredProducts, sort]);

  // Reusable Filter Sections matching uploaded screenshots exactly (compact spacing)
  const FilterAccordionContent = (
    <div className="divide-y divide-[#e5e5e5] text-sm">
      {/* 1. PRICE */}
      <div className="py-2.5">
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="flex w-full items-center justify-between text-[13px] font-serif uppercase tracking-[0.25em] text-[#111111] hover:text-black py-0.5"
        >
          <span>P R I C E</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-[#111111] transition-transform duration-200 ${
              openSections.price ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.price && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between font-serif text-[14px] text-[#111111]">
              <span>Rs.0</span>
              <span>Rs.{maxPrice.toLocaleString()}</span>
            </div>

            <div className="pt-1">
              <input
                type="range"
                min={0}
                max={464165}
                step={2500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-black cursor-pointer h-1.5 bg-neutral-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. SIZE */}
      <div className="py-2.5">
        <button
          type="button"
          onClick={() => toggleSection("size")}
          className="flex w-full items-center justify-between text-[13px] font-serif uppercase tracking-[0.25em] text-[#111111] hover:text-black py-0.5"
        >
          <span>S I Z E</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-[#111111] transition-transform duration-200 ${
              openSections.size ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.size && (
          <div className="mt-2.5 space-y-1.5">
            {SIZE_OPTIONS.map((s) => {
              const isChecked = selectedSizes.includes(s.key);
              const count = sizeCounts[s.key] || 0;
              return (
                <label
                  key={s.key}
                  className="flex items-center gap-3 text-[14px] font-serif text-[#111111] cursor-pointer select-none group py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSize(s.key)}
                    className="h-4 w-4 rounded-none border border-black/40 accent-black cursor-pointer"
                  />
                  <span className="group-hover:text-black">
                    {s.label} ({count})
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. COLOR */}
      <div className="py-2.5">
        <button
          type="button"
          onClick={() => toggleSection("color")}
          className="flex w-full items-center justify-between text-[13px] font-serif uppercase tracking-[0.25em] text-[#111111] hover:text-black py-0.5"
        >
          <span>C O L O R</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-[#111111] transition-transform duration-200 ${
              openSections.color ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.color && (
          <div className="mt-2.5 space-y-1.5">
            {COLOR_OPTIONS.map((c) => {
              const isSelected = selectedColors.includes(c.name);
              return (
                <div
                  key={c.name}
                  onClick={() => toggleColor(c.name)}
                  className="flex items-center gap-3 cursor-pointer group select-none py-0.5"
                >
                  {/* Outer circle with gap matching screenshot */}
                  <div
                    className={`w-6 h-6 rounded-full p-[2px] flex items-center justify-center transition-all ${
                      isSelected
                        ? "border border-black"
                        : "border border-neutral-300 group-hover:border-neutral-500"
                    }`}
                  >
                    <div
                      className="w-full h-full rounded-full border border-black/10"
                      style={{
                        background: c.isMulti
                          ? "conic-gradient(#f87171, #fbbf24, #34d399, #60a5fa, #a855f7, #f87171)"
                          : c.hex,
                      }}
                    />
                  </div>

                  {/* Label - underlined when selected matching screenshot */}
                  <span
                    className={`text-[14px] md:text-[15px] font-serif text-[#111111] transition-all ${
                      isSelected
                        ? "underline underline-offset-4 decoration-1 font-semibold"
                        : "group-hover:text-black"
                    }`}
                  >
                    {c.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. DRESS STYLE */}
      <div className="py-2.5">
        <button
          type="button"
          onClick={() => toggleSection("dressStyle")}
          className="flex w-full items-center justify-between text-[13px] font-serif uppercase tracking-[0.25em] text-[#111111] hover:text-black py-0.5"
        >
          <span>D R E S S &nbsp; S T Y L E</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-[#111111] transition-transform duration-200 ${
              openSections.dressStyle ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.dressStyle && (
          <div className="mt-2.5 space-y-1.5">
            {DRESS_STYLE_OPTIONS.map((st) => {
              const isChecked = selectedStyles.includes(st.key);
              const count = styleCounts[st.key] || 0;
              return (
                <label
                  key={st.key}
                  className="flex items-center gap-3 text-[14px] font-serif text-[#111111] cursor-pointer select-none group py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStyle(st.key)}
                    className="h-4 w-4 rounded-none border border-black/40 accent-black cursor-pointer"
                  />
                  <span className="group-hover:text-black">
                    {st.label} ({count})
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Reset button if active filters */}
      {hasActiveFilters && (
        <div className="pt-4">
          <button
            type="button"
            onClick={clearAllFilters}
            className="flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-black underline hover:text-black/70"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* ---------------------------------------------------- */}
      {/* CASE 1: SILLHOUETE SALE PAGE (media_1792667744429)  */}
      {/* ---------------------------------------------------- */}
      {isSalePage ? (
        <div>
          {/* Main Sale Layout: Persistent Left Sidebar + Right Products Grid */}
          <div className="flex items-start gap-8 lg:gap-12">
            {/* Desktop Persistent Left Sidebar */}
            <aside className="hidden md:block w-64 shrink-0 sticky top-28 self-start pr-4">
              {FilterAccordionContent}
            </aside>

            {/* Right Product Grid Area */}
            <div className="flex-1 min-w-0">
              {/* Top Subheader: Products Count on Left, Sort on Right */}
              <div className="mb-6 flex items-center justify-between border-b border-[#e5e5e5] pb-4">
                <div className="flex items-center gap-3">
                  {/* Mobile Filter Button for Sale Page */}
                  <button
                    type="button"
                    onClick={() => setFilterDrawerOpen(true)}
                    className="flex md:hidden items-center gap-2 border border-black/30 bg-white px-3.5 py-1.5 text-xs font-serif uppercase tracking-wider text-black hover:border-black transition-colors"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Filter</span>
                  </button>

                  <span className="font-serif text-[15px] text-[#111111]">
                    {sortedProducts.length} products
                  </span>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="appearance-none border border-black/30 bg-white pl-4 pr-9 py-2 text-xs font-serif tracking-wider text-black outline-none cursor-pointer focus:border-black"
                  >
                    <option value="featured">Featured</option>
                    <option value="best-selling">Best selling</option>
                    <option value="title-asc">Alphabetically, A-Z</option>
                    <option value="title-desc">Alphabetically, Z-A</option>
                    <option value="price-asc">Price, low to high</option>
                    <option value="price-desc">Price, high to low</option>
                    <option value="newest">Date, new to old</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/70" />
                </div>
              </div>

              {/* 4-Column Product Grid */}
              {sortedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {sortedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} isSale={true} />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center border border-dashed border-black/20 p-8">
                  <p className="font-serif text-base text-black">
                    No products found matching your filters.
                  </p>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="mt-5 border border-black bg-black px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ----------------------------------------------------------------- */
        /* CASE 2: OTHER COLLECTION PAGES (media_1792667804753_86fd33b0.png) */
        /* ----------------------------------------------------------------- */
        <div>
          {/* Top Controls Bar: [ ⊶ Filter ] on Left, [ Most relevant ∨ ] on Right */}
          <div className="mb-6 flex items-center justify-between border-b border-[#e5e5e5] pb-4">
            {/* Filter Drawer Trigger Button */}
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="flex items-center gap-2.5 border border-black/30 bg-white px-4 py-2 text-xs font-serif uppercase tracking-wider text-black hover:border-black transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filter</span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="appearance-none border border-black/30 bg-white pl-4 pr-9 py-2 text-xs font-serif tracking-wider text-black outline-none cursor-pointer focus:border-black"
              >
                <option value="relevant">Most relevant</option>
                <option value="featured">Featured</option>
                <option value="best-selling">Best selling</option>
                <option value="title-asc">Alphabetically, A-Z</option>
                <option value="title-desc">Alphabetically, Z-A</option>
                <option value="price-asc">Price, low to high</option>
                <option value="price-desc">Price, high to low</option>
                <option value="newest">Date, new to old</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/70" />
            </div>
          </div>

          {/* Product Grid */}
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {sortedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-black/20 p-8">
              <p className="font-serif text-base text-black">
                No products found matching your filters.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-5 border border-black bg-black px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* SLIDE-OUT FILTER DRAWER (media_1792667838611_12805c2f.png)         */}
      {/* ----------------------------------------------------------------- */}
      {filterDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex bg-black/50 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setFilterDrawerOpen(false)}
        >
          {/* Drawer Panel Sliding from Left */}
          <div
            className="relative h-full w-[340px] max-w-[85vw] flex flex-col bg-white shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Top Header matching screenshot */}
            <div className="flex items-center justify-between border-b border-[#e5e5e5] px-6 py-5">
              <h2 className="font-serif text-[17px] font-bold uppercase tracking-[0.15em] text-[#111111]">
                FILTER
              </h2>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="p-1 text-black/70 hover:text-black transition-colors"
                aria-label="Close filter"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Filter Content */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              {FilterAccordionContent}
            </div>

            {/* Bottom Action Button */}
            <div className="border-t border-[#e5e5e5] p-5">
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="w-full bg-black py-3.5 text-center text-xs font-bold uppercase tracking-[0.25em] text-white hover:bg-neutral-800 transition-colors shadow-sm"
              >
                Show {sortedProducts.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
