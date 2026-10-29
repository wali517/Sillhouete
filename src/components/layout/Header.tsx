"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { NAV, SITE } from "@/data/site";
import { allProducts } from "@/data/products";
import { useStore } from "@/components/providers/StoreProvider";
import MobileMenu from "./MobileMenu";
import type { Product } from "@/types";

export default function Header() {
  const router = useRouter();
  const { count, setCartOpen, formatPrice } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(q)}&limit=6`)
        .then((r) => r.json())
        .then((d) => {
          if (d.products && d.products.length > 0) {
            setResults(d.products.slice(0, 6));
          } else {
            // Fallback to client-side filtering of initial data
            const lower = q.toLowerCase();
            setResults(allProducts.filter((p) => p.title.toLowerCase().includes(lower)).slice(0, 6));
          }
        })
        .catch(() => {
          const lower = q.toLowerCase();
          setResults(allProducts.filter((p) => p.title.toLowerCase().includes(lower)).slice(0, 6));
        });
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    if (searchOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const NAV_ROW1 = NAV.slice(0, 8);
  const NAV_ROW2 = NAV.slice(8);

  return (
    <header className="relative z-40 border-b border-[#e8e8e1] bg-white">
      <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-4 px-4 py-3 md:px-10">
        {/* Left Logo */}
        <Link
          href="/"
          className="relative block h-[52px] w-[140px] shrink-0 md:h-[48px] md:w-[130px]"
          aria-label="Sillhouete home"
        >
          <Image
            src={SITE.logo}
            alt="sillhouete logo"
            fill
            sizes="140px"
            priority
            className="object-contain object-left"
          />
        </Link>

        {/* Primary Desktop Navigation: 2 Rows Centered */}
        <nav aria-label="Primary" className="hidden flex-1 flex-col items-center justify-center md:flex">
          {/* Row 1 */}
          <ul className="flex flex-wrap items-center justify-center gap-0.5">
            {NAV_ROW1.map((item) => {
              const hasDropdown = Boolean(item.children && item.children.length > 0);

              return (
                <li key={item.label} className="relative group">
                  <Link
                    href={item.href}
                    className={`relative flex items-center gap-1 px-1.5 py-1 text-[15px] uppercase tracking-wide font-normal transition-colors hover:text-black after:content-[''] after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[1.5px] after:bg-black after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-center ${
                      item.sale ? "text-[red] font-bold animate-blinks sale-menu" : "text-black/90"
                    }`}
                  >
                    <span>{item.label}</span>
                    {hasDropdown && (
                      <ChevronDown
                        className="h-3 w-3 opacity-60 transition-transform duration-200 group-hover:rotate-180"
                        aria-hidden="true"
                      />
                    )}
                  </Link>

                  {/* Vertical Dropdown on Hover */}
                  {hasDropdown && (
                    <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-0 top-full pt-1.5 z-50 pointer-events-none group-hover:pointer-events-auto">
                      <ul className="min-w-[210px] bg-white border border-black/10 shadow-xl py-2 text-left">
                        {item.children!.map((child) => (
                          <li key={child.label}>
                            <Link
                              href={child.href}
                              className="block px-5 py-2 text-[15px] text-black/85 hover:text-black hover:bg-neutral-50 transition-colors font-medium whitespace-nowrap"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Row 2 */}
          <ul className="flex flex-wrap items-center justify-center gap-2 mt-0.5">
            {NAV_ROW2.map((item) => {
              const hasDropdown = Boolean(item.children && item.children.length > 0);

              return (
                <li key={item.label} className="relative group">
                  <Link
                    href={item.href}
                    className="relative flex items-center gap-1 px-2.5 py-0.5 text-[15px] uppercase tracking-wide font-normal text-black/90 hover:text-black transition-colors after:content-[''] after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[1.5px] after:bg-black after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-center"
                  >
                    <span>{item.label}</span>
                    {hasDropdown && (
                      <ChevronDown
                        className="h-3 w-3 opacity-60 transition-transform duration-200 group-hover:rotate-180"
                        aria-hidden="true"
                      />
                    )}
                  </Link>

                  {/* Vertical Dropdown on Hover */}
                  {hasDropdown && (
                    <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-0 top-full pt-1.5 z-50 pointer-events-none group-hover:pointer-events-auto">
                      <ul className="min-w-[210px] bg-white border border-black/10 shadow-xl py-2 text-left">
                        {item.children!.map((child) => (
                          <li key={child.label}>
                            <Link
                              href={child.href}
                              className="block px-5 py-2 text-[15px] text-black/85 hover:text-black hover:bg-neutral-50 transition-colors font-medium whitespace-nowrap"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right Icons: Account, Search, Cart */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/account"
            className="hidden h-10 w-10 place-items-center md:grid text-black hover:text-black/70 transition-colors"
            aria-label="Customer Account"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              role="presentation"
              className="h-6 w-6"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeMiterlimit="10"
            >
              <path d="M35 39.84v-2.53c3.3-1.91 6-6.66 6-11.41 0-7.63 0-13.82-9-13.82s-9 6.19-9 13.82c0 4.75 2.7 9.51 6 11.41v2.53c-10.18.85-18 6-18 12.16h42c0-6.19-7.82-11.31-18-12.16Z" />
            </svg>
          </Link>

          <button
            type="button"
            onClick={() => setSearchOpen((o) => !o)}
            aria-expanded={searchOpen}
            aria-label="Search"
            className="grid h-10 w-10 place-items-center text-black hover:text-black/70 transition-colors cursor-pointer"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              role="presentation"
              className="h-6 w-6"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeMiterlimit="10"
            >
              <path d="M47.16 28.58A18.58 18.58 0 1 1 28.58 10a18.58 18.58 0 0 1 18.58 18.58ZM54 54 41.94 42" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Site navigation"
            className="grid h-10 w-10 place-items-center md:hidden text-black hover:text-black/70 cursor-pointer"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              role="presentation"
              className="h-6 w-6"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeMiterlimit="10"
            >
              <path d="M7 15h51M7 32h43M7 49h51" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Cart, ${count} items`}
            className="relative grid h-10 w-10 place-items-center text-black hover:text-black/70 transition-colors cursor-pointer"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              role="presentation"
              className="h-6 w-6"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeMiterlimit="10"
            >
              <path d="M11.375 17.863h41.25v36.75h-41.25z" />
              <path d="M22.25 18c0-7.105 4.35-9 9.75-9s9.75 1.895 9.75 9" />
            </svg>
            {count > 0 && (
              <span
                className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#111111] text-[9px] font-bold text-white"
                aria-hidden="true"
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Drawer matching Image 3 */}
      {searchOpen && (
        <>
          {/* Dimmed backdrop overlay covering page content underneath */}
          <div
            className="fixed inset-x-0 bottom-0 top-[110px] md:top-[115px] z-30 bg-black/45 backdrop-blur-[1px] transition-opacity"
            onClick={() => setSearchOpen(false)}
          />

          <div className="relative z-40 border-b border-[#e8e8e1] bg-white px-4 py-3 md:px-10 shadow-xs">
            <form onSubmit={submit} role="search" className="mx-auto flex max-w-3xl items-center gap-3">
              <div className="relative flex flex-1 items-stretch border border-black bg-white">
                <input
                  id="header-search"
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  autoComplete="off"
                  className="w-full h-11 bg-transparent px-4 pr-3 text-[14px] text-black placeholder:text-neutral-500 outline-none"
                />
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="w-12 h-11 bg-black text-white flex items-center justify-center shrink-0 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    role="presentation"
                    className="h-4 w-4"
                    viewBox="0 0 64 64"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeMiterlimit="10"
                  >
                    <path d="M47.16 28.58A18.58 18.58 0 1 1 28.58 10a18.58 18.58 0 0 1 18.58 18.58ZM54 54 41.94 42" />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
                className="p-1.5 text-neutral-800 hover:text-black transition-colors cursor-pointer"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  role="presentation"
                  className="h-5 w-5"
                  viewBox="0 0 64 64"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeMiterlimit="10"
                >
                  <path d="M16 16 48 48M48 16 16 48" />
                </svg>
              </button>
            </form>

            {/* Live Search Results Dropdown when query is entered */}
            {query.trim() && (
              <div className="mx-auto max-w-3xl mt-4 border-t border-neutral-200 pt-4">
                {results.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-black/60">
                        Products ({results.length})
                      </span>
                      <Link
                        href={`/search?q=${encodeURIComponent(query.trim())}`}
                        onClick={() => setSearchOpen(false)}
                        className="text-xs font-semibold uppercase tracking-wider text-black hover:underline"
                      >
                        View all results &rarr;
                      </Link>
                    </div>

                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                      {results.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/products/${p.handle}`}
                            onClick={() => setSearchOpen(false)}
                            className="group block"
                          >
                            <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-100 border border-black/10">
                              <Image
                                src={p.image}
                                alt={p.title}
                                fill
                                sizes="(min-width: 768px) 150px, 50vw"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                            <div className="mt-2 text-left">
                              <h4 className="text-xs font-semibold uppercase text-black truncate group-hover:underline">
                                {p.title}
                              </h4>
                              <p className="text-xs font-medium text-black/80 mt-0.5">
                                {formatPrice(p.price)}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-black/60 py-2">
                    No products found matching &ldquo;{query}&rdquo;. Press Enter to view all search results.
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
