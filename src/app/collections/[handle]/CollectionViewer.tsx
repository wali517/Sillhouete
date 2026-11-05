"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
  | "newest"
  | "oldest";

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
  initialPage = 1,
}: {
  title: string;
  initialProducts: Product[];
  isSalePage?: boolean;
  initialPage?: number;
}) {
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const gridTopRef = useRef<HTMLDivElement>(null);
  // Pagination state (28 products per page on Sale page, 60 per page on other collections matching live)
  const [currentPage, setCurrentPage] = useState<number>(initialPage || 1);
  const itemsPerPage = isSalePage ? 28 : 60;

  // Sort state
  const [sort, setSort] = useState<SortOption>("featured");

  // Filters state
  const [maxPrice, setMaxPrice] = useState<number>(464165);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Accordion open states (default closed, click to open)
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

  // Reset to page 1 whenever filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [sort, maxPrice, selectedColors, selectedSizes, selectedStyles]);

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
      if (p.price > maxPrice) return false;

      if (selectedColors.length > 0) {
        const textToSearch = `${p.title} ${p.description || ""} ${p.color || ""}`.toLowerCase();
        const matchesAnyColor = selectedColors.some((c) =>
          textToSearch.includes(c.toLowerCase())
        );
        if (!matchesAnyColor) return false;
      }

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

      if (selectedStyles.length > 0) {
        const text = `${p.title} ${p.description || ""} ${p.category || ""}`.toLowerCase();
        const matchesStyle = selectedStyles.some(
          (st) => st === "other" || text.includes(st)
        );
        if (!matchesStyle) return false;
      }

      return true;
    });
  }, [productsList, maxPrice, selectedColors, selectedSizes, selectedStyles]);

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
      case "oldest":
        return list.filter((p) => !p.isNew).concat(list.filter((p) => p.isNew));
      case "best-selling":
        return list.filter((p) => p.isBestSeller).concat(list.filter((p) => !p.isBestSeller));
      case "featured":
      case "relevant":
      default:
        return list;
    }
  }, [filteredProducts, sort]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const activePage = Math.min(Math.max(currentPage, 1), totalPages || 1);

  const paginatedProducts = useMemo(() => {
    const start = (activePage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, activePage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (newPage === 1) {
        url.searchParams.delete("page");
      } else {
        url.searchParams.set("page", String(newPage));
      }
      window.history.pushState(null, "", url.toString());
    }
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Reusable Filter Sections (matching Image 3 & live site)
  const FilterAccordionContent = (
    <div className="divide-y divide-[#e8e8e1] text-sm">
      {/* 1. PRICE */}
      <div className="py-3">
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="flex w-full items-center justify-between text-[12px] font-serif uppercase tracking-[0.22em] text-[#111111] hover:text-black py-0.5"
        >
          <span>P R I C E</span>
          <ChevronDown
            className={`h-3 w-3 text-[#111111] transition-transform duration-200 ${
              openSections.price ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.price && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between font-serif text-[13px] text-[#111111]">
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
      <div className="py-3">
        <button
          type="button"
          onClick={() => toggleSection("size")}
          className="flex w-full items-center justify-between text-[12px] font-serif uppercase tracking-[0.22em] text-[#111111] hover:text-black py-0.5"
        >
          <span>S I Z E</span>
          <ChevronDown
            className={`h-3 w-3 text-[#111111] transition-transform duration-200 ${
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
                  className="flex items-center gap-2.5 text-[13px] font-serif text-[#111111] cursor-pointer select-none group py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSize(s.key)}
                    className="h-3.5 w-3.5 rounded-none border border-black/40 accent-black cursor-pointer"
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
      <div className="py-3">
        <button
          type="button"
          onClick={() => toggleSection("color")}
          className="flex w-full items-center justify-between text-[12px] font-serif uppercase tracking-[0.22em] text-[#111111] hover:text-black py-0.5"
        >
          <span>C O L O R</span>
          <ChevronDown
            className={`h-3 w-3 text-[#111111] transition-transform duration-200 ${
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
                  className="flex items-center gap-2.5 cursor-pointer group select-none py-0.5"
                >
                  <div
                    className={`w-5 h-5 rounded-full p-[2px] flex items-center justify-center transition-all ${
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

                  <span
                    className={`text-[13px] font-serif text-[#111111] transition-all ${
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
      <div className="py-3">
        <button
          type="button"
          onClick={() => toggleSection("dressStyle")}
          className="flex w-full items-center justify-between text-[12px] font-serif uppercase tracking-[0.22em] text-[#111111] hover:text-black py-0.5"
        >
          <span>D R E S S &nbsp; S T Y L E</span>
          <ChevronDown
            className={`h-3 w-3 text-[#111111] transition-transform duration-200 ${
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
                  className="flex items-center gap-2.5 text-[13px] font-serif text-[#111111] cursor-pointer select-none group py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStyle(st.key)}
                    className="h-3.5 w-3.5 rounded-none border border-black/40 accent-black cursor-pointer"
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
        <div className="pt-3">
          <button
            type="button"
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 text-[11px] font-serif uppercase tracking-widest text-black underline hover:text-black/70"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </div>
  );

  // Pagination Controls matching Image 1 & Image 2 and live Shopify site exactly
  const PaginationControls = totalPages > 1 ? (
    <div className="py-[60px] text-center select-none flex items-center justify-center">
      <div className="flex items-center justify-center">
        {/* Prev button: square black box with white chevron (hidden on page 1) */}
        {activePage > 1 ? (
          <span className="inline-block align-middle mx-[10px] w-[35px] md:w-[43px] h-[35px] md:h-[43px] bg-black text-white">
            <button
              type="button"
              onClick={() => handlePageChange(activePage - 1)}
              aria-label="Previous page"
              className="w-full h-full flex items-center justify-center text-white hover:opacity-85 cursor-pointer"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                role="presentation"
                className="w-[12px] md:w-[13px] h-[12px] md:h-[14px] fill-current"
                viewBox="0 0 284.49 498.98"
              >
                <path d="M249.49 0a35 35 0 0 1 24.75 59.75L84.5 249.49l189.74 189.74a35.002 35.002 0 0 1-49.5 49.5L10.25 274.24a35 35 0 0 1 0-49.5L224.74 10.25A34.89 34.89 0 0 1 249.49 0Z" />
              </svg>
            </button>
          </span>
        ) : null}

        {/* Page numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
          const isCurrent = p === activePage;
          return isCurrent ? (
            <span
              key={p}
              className="inline-block align-middle px-[12px] py-[8px] font-serif text-[16px] md:text-[18px] opacity-30 cursor-default select-none text-black"
              aria-current="page"
            >
              {p}
            </span>
          ) : (
            <span key={p} className="inline-block align-middle">
              <button
                type="button"
                onClick={() => handlePageChange(p)}
                className="inline-block px-[12px] py-[8px] font-serif text-[16px] md:text-[18px] text-[#111111] hover:text-[#0056b3] transition-colors cursor-pointer"
              >
                {p}
              </button>
            </span>
          );
        })}

        {/* Next button: square black box with white chevron (hidden on last page) */}
        {activePage < totalPages ? (
          <span className="inline-block align-middle mx-[10px] w-[35px] md:w-[43px] h-[35px] md:h-[43px] bg-black text-white">
            <button
              type="button"
              onClick={() => handlePageChange(activePage + 1)}
              aria-label="Next page"
              className="w-full h-full flex items-center justify-center text-white hover:opacity-85 cursor-pointer"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                role="presentation"
                className="w-[12px] md:w-[13px] h-[12px] md:h-[14px] fill-current"
                viewBox="0 0 284.49 498.98"
              >
                <path d="M35 498.98a35 35 0 0 1-24.75-59.75l189.74-189.74L10.25 59.75a35.002 35.002 0 0 1 49.5-49.5l214.49 214.49a35 35 0 0 1 0 49.5L59.75 488.73A34.89 34.89 0 0 1 35 498.98Z" />
              </svg>
            </button>
          </span>
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <div ref={gridTopRef}>
      {/* ---------------------------------------------------- */}
      {/* CASE 1: SILLHOUETE SALE PAGE (Image 3)               */}
      {/* ---------------------------------------------------- */}
      {isSalePage ? (
        <div>
          {/* Main Sale Layout: Persistent Left Sidebar + Right Products Grid */}
          <div className="flex items-start gap-6 lg:gap-10">
            {/* Desktop Persistent Left Sidebar matching Image 3 */}
            <aside className="hidden md:block w-[205px] lg:w-[225px] shrink-0 sticky top-24 self-start pr-2">
              {FilterAccordionContent}
            </aside>

            {/* Right Product Grid Area */}
            <div className="flex-1 min-w-0">
              {/* Top Subheader: Products Count on Left, Sort on Right (Image 3) */}
              <div className="mb-6 flex items-center justify-between pb-3">
                <div className="flex items-center gap-3">
                  {/* Mobile Filter Button for Sale Page */}
                  <button
                    type="button"
                    onClick={() => setFilterDrawerOpen(true)}
                    className="flex md:hidden items-center gap-2 border border-[#e8e8e1] bg-white px-3.5 py-1.5 text-xs font-serif uppercase tracking-wider text-black hover:border-black transition-colors"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Filter</span>
                  </button>

                  <span className="font-serif text-[13px] md:text-[14px] text-[#111111]">
                    {sortedProducts.length} products
                  </span>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="appearance-none border border-[#e8e8e1] bg-white pl-3.5 pr-8 py-1.5 text-xs font-serif tracking-wider text-[#111111] outline-none cursor-pointer focus:border-black"
                  >
                    <option value="featured">Featured</option>
                    <option value="best-selling">Best selling</option>
                    <option value="title-asc">Alphabetically, A-Z</option>
                    <option value="title-desc">Alphabetically, Z-A</option>
                    <option value="price-asc">Price, low to high</option>
                    <option value="price-desc">Price, high to low</option>
                    <option value="oldest">Date, old to new</option>
                    <option value="newest">Date, new to old</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/70" />
                </div>
              </div>

              {/* 4-Column Product Grid (Image 3) */}
              {paginatedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-x-4 md:gap-y-8">
                  {paginatedProducts.map((p, i) => (
                    <ProductCard key={p.id} product={p} isSale={true} index={i} />
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

              {/* Pagination matching Image 1 & 2 */}
              {PaginationControls}
            </div>
          </div>
        </div>
      ) : (
        /* ----------------------------------------------------------------- */
        /* CASE 2: OTHER COLLECTION PAGES (Image 4)                          */
        /* ----------------------------------------------------------------- */
        <div>
          {/* Top Controls Bar: [ ⊶ Filter ] on Left, [ Most relevant ∨ ] on Right (Image 4) */}
          <div className="mb-6 flex items-center justify-between pb-3">
            {/* Filter Drawer Trigger Button */}
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="flex items-center gap-2 border border-[#e8e8e1] bg-white px-4 py-2 text-xs font-serif uppercase tracking-wider text-[#111111] hover:border-black transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filter</span>
            </button>

            {/* Sort Dropdown (Image 4) */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="appearance-none border border-[#e8e8e1] bg-white pl-4 pr-8 py-2 text-xs font-serif tracking-wider text-[#111111] outline-none cursor-pointer focus:border-black"
              >
                <option value="featured">Featured</option>
                <option value="relevant">Most relevant</option>
                <option value="best-selling">Best selling</option>
                <option value="title-asc">Alphabetically, A-Z</option>
                <option value="title-desc">Alphabetically, Z-A</option>
                <option value="price-asc">Price, low to high</option>
                <option value="price-desc">Price, high to low</option>
                <option value="oldest">Date, old to new</option>
                <option value="newest">Date, new to old</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/70" />
            </div>
          </div>

          {/* Product Grid (Full Width 4 columns, Image 4) */}
          {paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-x-5 md:gap-y-8">
              {paginatedProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
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

          {/* Pagination matching Image 1 & 2 */}
          {PaginationControls}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* SLIDE-OUT FILTER DRAWER FOR ALL OTHER PAGES                        */}
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
            className="relative h-full w-[320px] max-w-[85vw] flex flex-col bg-white shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Top Header */}
            <div className="flex items-center justify-between border-b border-[#e8e8e1] px-6 py-4">
              <h2 className="font-serif text-[15px] font-bold uppercase tracking-[0.18em] text-[#111111]">
                FILTER
              </h2>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="p-1 text-black/70 hover:text-black transition-colors cursor-pointer"
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
            <div className="border-t border-[#e8e8e1] p-4">
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="w-full bg-black py-3 text-center text-xs font-bold uppercase tracking-[0.25em] text-white hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer"
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
