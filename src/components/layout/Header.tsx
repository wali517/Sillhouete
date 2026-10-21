"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { NAV, SITE } from "@/data/site";
import { allProducts } from "@/data/products";
import { useStore } from "@/components/providers/StoreProvider";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const router = useRouter();
  const { count, setCartOpen, formatPrice } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? allProducts.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 6) : [];
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
    <header className="relative z-40 border-b border-black/10 bg-white">
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
                    className={`relative flex items-center gap-1 px-2.5 py-1 text-[12px] uppercase tracking-wide font-normal transition-colors hover:text-black after:content-[''] after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[1.5px] after:bg-black after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-center ${
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
                              className="block px-5 py-2 text-[13px] text-black/85 hover:text-black hover:bg-neutral-50 transition-colors font-medium whitespace-nowrap"
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
                    className="relative flex items-center gap-1 px-2.5 py-0.5 text-[12px] uppercase tracking-wide font-normal text-black/90 hover:text-black transition-colors after:content-[''] after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[1.5px] after:bg-black after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-center"
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
                              className="block px-5 py-2 text-[13px] text-black/85 hover:text-black hover:bg-neutral-50 transition-colors font-medium whitespace-nowrap"
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
            className="hidden h-10 w-10 place-items-center md:grid text-black/85 hover:text-black"
            aria-label="Customer Account"
          >
            <User className="h-5 w-5 stroke-[1.5]" />
          </Link>

          <button
            type="button"
            onClick={() => setSearchOpen((o) => !o)}
            aria-expanded={searchOpen}
            aria-label="Search"
            className="grid h-10 w-10 place-items-center text-black/85 hover:text-black"
          >
            <Search className="h-5 w-5 stroke-[1.5]" />
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Site navigation"
            className="grid h-10 w-10 place-items-center md:hidden"
          >
            <Menu className="h-5 w-5 stroke-[1.5]" />
          </button>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Cart, ${count} items`}
            className="relative grid h-10 w-10 place-items-center text-black/85 hover:text-black"
          >
            <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
            {count > 0 && (
              <span
                className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white"
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

          <div className="relative z-40 border-t border-b border-black/10 bg-white px-4 py-4 md:px-10 shadow-md">
            <form onSubmit={submit} role="search" className="mx-auto flex max-w-3xl items-center gap-3">
              <div className="relative flex-1">
                <input
                  id="header-search"
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  autoComplete="off"
                  className="w-full h-11 border border-neutral-400 bg-white px-4 pr-11 text-sm text-black placeholder:text-neutral-500 outline-none focus:border-black transition-colors"
                />
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="absolute right-0 top-0 bottom-0 px-3.5 flex items-center justify-center text-neutral-600 hover:text-black transition-colors"
                >
                  <Search className="h-4 w-4 stroke-[1.75]" />
                </button>
              </div>

              <button
                type="button"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
                className="p-1.5 text-neutral-800 hover:text-black transition-colors"
              >
                <X className="h-6 w-6 stroke-[1.5]" />
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
