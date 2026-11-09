"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NAV, SITE } from "@/data/site";
import type { NavLink } from "@/types";
import { useStore } from "@/components/providers/StoreProvider";
import MobileMenu from "./MobileMenu";
import PredictivePanel, { preloadSearchCatalog } from "@/components/search/PredictivePanel";

export default function Header() {
  const router = useRouter();
  const { count, setCartOpen } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [navItems, setNavItems] = useState<NavLink[]>(NAV);

  useEffect(() => {
    fetch("/api/categories/nav")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.nav) && data.nav.length > 0) {
          setNavItems(data.nav);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    if (searchOpen) {
      preloadSearchCatalog();
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

  const ROW1_KEYS = [
    "sale",
    "maahi ii luxury eid pret",
    "new arrivals",
    "bridals",
    "formal",
    "luxury pret",
    "pret",
    "shop by events",
  ];

  const NAV_ROW1 = navItems.filter((item) => {
    const l = item.label.toLowerCase();
    return ROW1_KEYS.includes(l);
  });

  const NAV_ROW2 = navItems.filter((item) => {
    const l = item.label.toLowerCase();
    return !ROW1_KEYS.includes(l);
  });

  return (
    <header className="relative z-40 border-b border-[#e8e8e1] bg-white font-serif">
      <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 md:px-6 lg:gap-4 lg:px-10 lg:py-3">
        {/* Left Logo */}
        <Link
          href="/"
          className="relative block h-[44px] w-[112px] shrink-0 sm:h-[48px] sm:w-[126px] lg:h-[48px] lg:w-[130px]"
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
        <nav aria-label="Primary" className="hidden flex-1 flex-col items-center justify-center lg:flex">
          {/* Row 1 */}
          <ul className="flex flex-wrap items-center justify-center gap-x-4 lg:gap-x-5 xl:gap-x-6">
            {NAV_ROW1.map((item) => {
              const hasDropdown = Boolean(item.children && item.children.length > 0);

              return (
                <li key={item.label} className="relative group">
                  <Link
                    href={item.href}
                    className={`relative flex items-center gap-0.5 px-1 py-1 text-[13px] xl:text-[14px] uppercase tracking-[0.06em] font-normal transition-colors hover:text-black after:content-[''] after:absolute after:bottom-0 after:left-1 after:right-1 after:h-[1.5px] after:bg-black after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-200 after:ease-out after:origin-left ${
                      item.sale ? "!text-[#ff0000] font-normal animate-blinks sale-menu" : "text-black"
                    }`}
                  >
                    <span>{item.label}</span>
                    {hasDropdown && (
                      <svg
                        aria-hidden="true"
                        focusable="false"
                        role="presentation"
                        className="w-[8px] h-[5px] opacity-70 transition-transform duration-200 group-hover:rotate-180 ml-1"
                        viewBox="0 0 28 16"
                      >
                        <path
                          d="m1.57 1.59 12.76 12.77L27.1 1.59"
                          strokeWidth="2.5"
                          stroke="currentColor"
                          fill="none"
                        />
                      </svg>
                    )}
                  </Link>

                  {/* Vertical Dropdown on Hover */}
                  {hasDropdown && (
                    <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute left-0 top-full pt-1.5 z-50 pointer-events-none group-hover:pointer-events-auto">
                      <ul className="min-w-[220px] bg-white border border-black/[0.08] shadow-[0_10px_24px_rgba(0,0,0,0.08)] py-2.5 text-left font-serif">
                        {item.children!.map((child) => {
                          const isMeeras = child.blink || child.label.toLowerCase() === "meeras";
                          const isHighlight = child.highlight || child.label.includes("Raha Eid Pret");

                          return (
                            <li key={child.label}>
                              <Link
                                href={child.href}
                                className={`block px-5 py-2 text-[14px] transition-colors whitespace-nowrap hover:bg-neutral-50 ${
                                  isMeeras
                                    ? "text-[#ff0000] font-normal blink-meeras"
                                    : isHighlight
                                    ? "text-[#ff0000] font-normal highlight-red hover:text-[#ff0000]"
                                    : "text-black/85 hover:text-black font-normal"
                                }`}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Row 2 */}
          <ul className="flex flex-wrap items-center justify-center gap-x-5 lg:gap-x-7 mt-1.5">
            {NAV_ROW2.map((item) => {
              const hasDropdown = Boolean(item.children && item.children.length > 0);

              return (
                <li key={item.label} className="relative group">
                  <Link
                    href={item.href}
                    className="relative flex items-center gap-0.5 px-1.5 py-0.5 text-[13px] xl:text-[14px] uppercase tracking-[0.06em] font-normal text-black hover:text-black transition-colors after:content-[''] after:absolute after:bottom-0 after:left-1 after:right-1 after:h-[1.5px] after:bg-black after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-200 after:ease-out after:origin-left"
                  >
                    <span>{item.label}</span>
                    {hasDropdown && (
                      <svg
                        aria-hidden="true"
                        focusable="false"
                        role="presentation"
                        className="w-[8px] h-[5px] opacity-70 transition-transform duration-200 group-hover:rotate-180 ml-1"
                        viewBox="0 0 28 16"
                      >
                        <path
                          d="m1.57 1.59 12.76 12.77L27.1 1.59"
                          strokeWidth="2.5"
                          stroke="currentColor"
                          fill="none"
                        />
                      </svg>
                    )}
                  </Link>

                  {/* Vertical Dropdown on Hover */}
                  {hasDropdown && (
                    <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute left-0 top-full pt-1.5 z-50 pointer-events-none group-hover:pointer-events-auto">
                      <ul className="min-w-[220px] bg-white border border-black/[0.08] shadow-[0_10px_24px_rgba(0,0,0,0.08)] py-2.5 text-left font-serif">
                        {item.children!.map((child) => {
                          const isMeeras = child.blink || child.label.toLowerCase() === "meeras";
                          const isHighlight = child.highlight || child.label.includes("Raha Eid Pret");

                          return (
                            <li key={child.label}>
                              <Link
                                href={child.href}
                                className={`block px-5 py-2 text-[14px] transition-colors whitespace-nowrap hover:bg-neutral-50 ${
                                  isMeeras
                                    ? "text-[#ff0000] font-normal blink-meeras"
                                    : isHighlight
                                    ? "text-[#ff0000] font-normal highlight-red hover:text-[#ff0000]"
                                    : "text-black/85 hover:text-black font-normal"
                                }`}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right Icons: Account, Search, Cart */}
        <div className="flex shrink-0 items-center gap-0 sm:gap-1">
          <Link
            href="/account"
            className="hidden h-10 w-10 place-items-center lg:grid text-black hover:text-black/70 transition-colors"
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
            onMouseEnter={() => preloadSearchCatalog()}
            aria-expanded={searchOpen}
            aria-label="Search"
            className="grid h-9 w-9 place-items-center text-black hover:text-black/70 transition-colors cursor-pointer sm:h-10 sm:w-10"
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
            className="grid h-10 w-10 place-items-center lg:hidden text-black hover:text-black/90 cursor-pointer"
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
            className="relative grid h-10 w-10 place-items-center text-black hover:text-black/90 transition-colors cursor-pointer"
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

      {/* Search: replaces the header bar (light-gray strip, wide input, X outside) */}
      {searchOpen && (
        <>
          {/* Light veil over the page content underneath */}
          <div
            aria-hidden="true"
            className="search-veil fixed inset-0 -z-10 bg-[rgba(239,239,239,0.82)]"
            onClick={() => setSearchOpen(false)}
          />

          <div className="search-panel absolute inset-0 z-50 flex flex-col justify-center bg-[#efefef] shadow-[0_12px_24px_-12px_rgba(0,0,0,0.18)]">
            <div className="relative">
              <form
                onSubmit={submit}
                role="search"
                className="flex items-center gap-4 px-4 py-4 md:gap-8 md:px-[12vw]"
              >
                <div className="relative flex-1">
                  <input
                    id="header-search"
                    autoFocus
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search"
                    autoComplete="off"
                    className="search-input h-12 w-full px-3 pr-14 text-[15px] text-black transition-colors placeholder:text-neutral-400"
                  />
                  <button
                    type="submit"
                    aria-label="Submit search"
                    className="plain-btn absolute bottom-0 right-0 top-0 flex items-center justify-center px-4"
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
                </div>

                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => setSearchOpen(false)}
                  className="-mr-1 grid h-10 w-10 shrink-0 place-items-center text-black transition-opacity hover:opacity-60 md:mr-0"
                >
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    role="presentation"
                    className="h-7 w-7"
                    viewBox="0 0 64 64"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="m19 17.61 27.12 27.13m0-27.12L19 44.74" />
                  </svg>
                </button>
              </form>

              <PredictivePanel query={query} onNavigate={() => setSearchOpen(false)} />
            </div>
          </div>
        </>
      )}

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} navItems={navItems} />
    </header>
  );
}
