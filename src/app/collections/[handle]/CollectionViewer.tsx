"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/types";
import { SlidersHorizontal, X, ChevronDown, Check, RotateCcw } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";

type SortOption = "featured" | "price-asc" | "price-desc" | "title-asc" | "title-desc" | "newest";

const COLOR_PALETTE: { name: string; hex: string }[] = [
  { name: "Black", hex: "#111111" },
  { name: "Green", hex: "#1e5934" },
  { name: "Pink", hex: "#f472b6" },
  { name: "Blue", hex: "#1e3a8a" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Red", hex: "#b91c1c" },
  { name: "Ivory", hex: "#f5f5dc" },
  { name: "Mint", hex: "#86efac" },
  { name: "Grey", hex: "#6b7280" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Purple", hex: "#a855f7" },
];

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "Custom Size"];

export default function CollectionViewer({
  title,
  initialProducts,
  isSalePage = false,
}: {
  title: string;
  initialProducts: Product[];
  isSalePage?: boolean;
}) {
  const { formatPrice } = useStore();

  // Filters State
  const [sort, setSort] = useState<SortOption>("featured");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(200000);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sections toggle
  const [openSections, setOpenSections] = useState({
    price: true,
    color: true,
    size: true,
    availability: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const clearAllFilters = () => {
    setMinPrice(0);
    setMaxPrice(200000);
    setSelectedColors([]);
    setSelectedSizes([]);
    setInStockOnly(false);
  };

  const hasActiveFilters =
    minPrice > 0 ||
    maxPrice < 200000 ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    inStockOnly;

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      // Price
      if (p.price < minPrice || p.price > maxPrice) return false;

      // In stock
      if (inStockOnly && p.inStock === false) return false;

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
        const hasMatchingSize = selectedSizes.some((s) =>
          productSizes.includes(s) || s === "Custom Size"
        );
        if (!hasMatchingSize) return false;
      }

      return true;
    });
  }, [initialProducts, minPrice, maxPrice, selectedColors, selectedSizes, inStockOnly]);

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
      case "featured":
      default:
        return list;
    }
  }, [filteredProducts, sort]);

  const FilterContent = (
    <div className="space-y-6 text-sm">
      <div className="flex items-center justify-between border-b border-black/10 pb-3">
        <h3 className="font-bold uppercase tracking-wider text-xs text-black">
          Filter By
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-[11px] font-semibold text-black/60 hover:text-black uppercase tracking-wider underline"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 1. Price Filter */}
      <div className="border-b border-black/10 pb-5">
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="flex w-full items-center justify-between font-semibold uppercase tracking-wider text-xs text-black py-1"
        >
          <span>Pricing</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              openSections.price ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.price && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-black/70">
              <span>{formatPrice(minPrice)}</span>
              <span>{formatPrice(maxPrice)}</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={200000}
                step={2500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div>
                <label className="block text-[10px] text-black/50 uppercase">Min Price</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full border border-black/20 p-1.5 outline-none focus:border-black text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-black/50 uppercase">Max Price</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Math.max(minPrice, Number(e.target.value)))}
                  className="w-full border border-black/20 p-1.5 outline-none focus:border-black text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Colour / Color Options */}
      <div className="border-b border-black/10 pb-5">
        <button
          type="button"
          onClick={() => toggleSection("color")}
          className="flex w-full items-center justify-between font-semibold uppercase tracking-wider text-xs text-black py-1"
        >
          <span>Colour Option</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              openSections.color ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.color && (
          <div className="mt-4 flex flex-wrap gap-2">
            {COLOR_PALETTE.map((c) => {
              const isSelected = selectedColors.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => toggleColor(c.name)}
                  className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all ${
                    isSelected
                      ? "border-black bg-black text-white font-semibold shadow"
                      : "border-black/15 bg-white text-black/80 hover:border-black/40"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span
                    className="h-3 w-3 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Size Filter */}
      <div className="border-b border-black/10 pb-5">
        <button
          type="button"
          onClick={() => toggleSection("size")}
          className="flex w-full items-center justify-between font-semibold uppercase tracking-wider text-xs text-black py-1"
        >
          <span>Size</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              openSections.size ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.size && (
          <div className="mt-4 grid grid-cols-3 gap-1.5">
            {AVAILABLE_SIZES.map((size) => {
              const isSelected = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`border py-1.5 text-center text-xs uppercase tracking-wider transition-all ${
                    isSelected
                      ? "border-black bg-black text-white font-bold"
                      : "border-black/15 bg-white text-black/80 hover:border-black"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Availability */}
      <div className="pb-2">
        <button
          type="button"
          onClick={() => toggleSection("availability")}
          className="flex w-full items-center justify-between font-semibold uppercase tracking-wider text-xs text-black py-1"
        >
          <span>Availability</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              openSections.availability ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.availability && (
          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-black/80">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 accent-black rounded"
              />
              <span>In stock only</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* Top Controls Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-4 text-xs">
        {/* Filter Button (ONLY ON SALE PAGE) */}
        <div className="flex items-center gap-3">
          {isSalePage && (
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="flex items-center gap-2 border border-black/20 bg-white px-3.5 py-2 uppercase tracking-wider font-semibold text-black hover:border-black transition-colors md:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filter {hasActiveFilters ? `(${selectedColors.length + selectedSizes.length + (inStockOnly ? 1 : 0)})` : ""}</span>
            </button>
          )}

          <span className="text-black/60 font-medium uppercase tracking-wider text-xs">
            {sortedProducts.length} Products
          </span>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="collection-sort" className="text-black/70 font-semibold uppercase tracking-wider text-[11px]">
            Sort by:
          </label>
          <div className="relative">
            <select
              id="collection-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="appearance-none border border-black/20 bg-white pl-3 pr-8 py-2 text-xs outline-none focus:border-black font-medium cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="newest">New Arrivals</option>
              <option value="price-asc">Price, low to high</option>
              <option value="price-desc">Price, high to low</option>
              <option value="title-asc">Alphabetically, A-Z</option>
              <option value="title-desc">Alphabetically, Z-A</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/60" />
          </div>
        </div>
      </div>

      {/* Active Filter Pills Bar */}
      {hasActiveFilters && (
        <div className="mb-6 flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 mr-1">
            Active:
          </span>
          {selectedColors.map((color) => (
            <span
              key={color}
              className="inline-flex items-center gap-1 rounded-full bg-neutral-100 border border-black/10 px-2.5 py-1 text-[11px] font-semibold text-black"
            >
              Color: {color}
              <button
                type="button"
                onClick={() => toggleColor(color)}
                className="hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selectedSizes.map((size) => (
            <span
              key={size}
              className="inline-flex items-center gap-1 rounded-full bg-neutral-100 border border-black/10 px-2.5 py-1 text-[11px] font-semibold text-black"
            >
              Size: {size}
              <button
                type="button"
                onClick={() => toggleSize(size)}
                className="hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {maxPrice < 200000 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 border border-black/10 px-2.5 py-1 text-[11px] font-semibold text-black">
              Under {formatPrice(maxPrice)}
              <button
                type="button"
                onClick={() => setMaxPrice(200000)}
                className="hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {inStockOnly && (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 border border-black/10 px-2.5 py-1 text-[11px] font-semibold text-black">
              In Stock
              <button
                type="button"
                onClick={() => setInStockOnly(false)}
                className="hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[11px] font-bold uppercase tracking-wider text-black underline hover:text-black/70 ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Layout: Left Filter Sidebar (ONLY ON SALE PAGE) + Products Grid */}
      <div className={`flex gap-8 lg:gap-12 items-start ${!isSalePage ? "block" : ""}`}>
        {/* Desktop Left Filter Sidebar - ONLY SHOWN ON SALE PAGE */}
        {isSalePage && (
          <aside className="hidden md:block w-64 shrink-0 sticky top-28 self-start bg-white p-4 border border-black/10 rounded-sm">
            {FilterContent}
          </aside>
        )}

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {sortedProducts.length > 0 ? (
            <div
              className={`grid gap-3 sm:gap-4 ${
                isSalePage
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-3"
                  : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
              }`}
            >
              {sortedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-black/20 p-8">
              <p className="text-base font-medium text-black">No products found matching your filters.</p>
              <p className="mt-1 text-xs text-black/60">Try adjusting your price range, color, or size selection.</p>
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

      {/* Mobile Slide-Over Filter Drawer */}
      {mobileFilterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[110] flex bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileFilterOpen(false)}
        >
          <div
            className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-white shadow-2xl p-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-4">
              <h2 className="font-bold uppercase tracking-wider text-sm">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-neutral-100"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1">{FilterContent}</div>

            <div className="mt-6 border-t border-black/10 pt-4">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full bg-black py-3 text-center text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800"
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
