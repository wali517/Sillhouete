"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/components/providers/StoreProvider";
import { executePredictiveSearch, type PredictiveResult } from "@/lib/predictive-search";
import type { Product } from "@/types";

let memoryCatalog: Product[] = [];
let pendingFetch: Promise<Product[]> | null = null;

export function preloadSearchCatalog(): Promise<Product[]> {
  if (typeof window === "undefined") return Promise.resolve([]);
  if (memoryCatalog.length > 0) return Promise.resolve(memoryCatalog);
  if (!pendingFetch) {
    pendingFetch = fetch("/api/products")
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => {
        if (Array.isArray(data.products) && data.products.length > 0) {
          memoryCatalog = data.products;
          return memoryCatalog;
        }
        return [];
      })
      .catch(() => [])
      .finally(() => {
        pendingFetch = null;
      });
  }
  return pendingFetch;
}

const heading =
  "border-b border-black/10 pb-2 text-[11px] font-bold uppercase tracking-[0.3em] text-black";
const linkRow = "block py-[7px] pl-2 text-[14px] text-black/90 hover:text-black hover:underline";

export default function PredictivePanel({
  query,
  onNavigate,
}: {
  query: string;
  onNavigate: () => void;
}) {
  const { formatPrice } = useStore();
  const q = query.trim();

  const [catalog, setCatalog] = useState<Product[]>(() => memoryCatalog);
  const [serverFallback, setServerFallback] = useState<PredictiveResult | null>(null);

  // Preload catalog on mount if not already cached
  useEffect(() => {
    preloadSearchCatalog().then((prods) => {
      if (prods.length > 0) {
        setCatalog(prods);
      }
    });
  }, []);

  // Synchronously compute instant results from memoryCatalog if available!
  const localResult = useMemo(() => {
    if (!q) return null;
    if (catalog.length > 0) {
      return executePredictiveSearch(q, catalog, 6);
    }
    return null;
  }, [q, catalog]);

  // Fallback to server API if catalog isn't loaded yet
  useEffect(() => {
    if (!q) {
      setServerFallback(null);
      return;
    }

    if (catalog.length > 0) return;

    let active = true;
    fetch(`/api/predictive-search?q=${encodeURIComponent(q)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) {
          setServerFallback(data);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [q, catalog.length]);

  if (!q) return null;

  const r: PredictiveResult = localResult || serverFallback || {
    suggestions: [],
    pages: [],
    collections: [],
    products: [],
  };

  const hasLeft = r.suggestions.length + r.pages.length + r.collections.length > 0;
  const empty = !hasLeft && r.products.length === 0;

  return (
    <div
      role="listbox"
      aria-label="Search suggestions"
      className="absolute left-4 right-4 top-[calc(100%-8px)] z-50 flex max-h-[calc(100vh-150px)] flex-col bg-white shadow-[0_14px_34px_rgba(0,0,0,0.16)] md:left-[12.6vw] md:right-[11.5vw]"
    >
      <div className="flex-1 overflow-y-auto px-5 py-5 md:px-[30px] md:py-6">
        {empty ? (
          <p className="py-6 text-center text-[14px] text-black/70">
            No results found for &ldquo;{q}&rdquo;.
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-[minmax(0,34%)_minmax(0,1fr)] md:gap-10">
            {hasLeft && (
              <div className="space-y-7">
                {r.suggestions.length > 0 && (
                  <section>
                    <h3 className={heading}>Suggestions</h3>
                    <ul className="mt-2">
                      {r.suggestions.map((s) => (
                        <li key={s}>
                          <Link
                            href={`/search?q=${encodeURIComponent(s)}`}
                            onClick={onNavigate}
                            className={`${linkRow} font-bold capitalize`}
                          >
                            {s}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {r.pages.length > 0 && (
                  <section>
                    <h3 className={heading}>Pages</h3>
                    <ul className="mt-2">
                      {r.pages.map((x) => (
                        <li key={x.href}>
                          <Link href={x.href} onClick={onNavigate} className={linkRow}>
                            {x.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {r.collections.length > 0 && (
                  <section>
                    <h3 className={heading}>Collections</h3>
                    <ul className="mt-2">
                      {r.collections.map((x) => (
                        <li key={x.href}>
                          <Link href={x.href} onClick={onNavigate} className={linkRow}>
                            {x.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}

            {r.products.length > 0 && (
              <section className={hasLeft ? "" : "md:col-span-2"}>
                <h3 className={heading}>Products</h3>
                <ul className="mt-3">
                  {r.products.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/products/${p.handle}`}
                        onClick={onNavigate}
                        className="flex items-center gap-3 p-2 transition-colors hover:bg-[#f0f0f0]"
                      >
                        <span className="relative h-[66px] w-[60px] shrink-0 overflow-hidden bg-[#f7f6f3]">
                          <Image
                            src={p.image}
                            alt={p.alt || p.title}
                            fill
                            sizes="60px"
                            className="object-cover"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] text-black">{p.title}</span>
                          <span className="mt-0.5 block text-[10px] uppercase tracking-[0.3em] text-black/45">
                            Sillhouete
                          </span>
                          <span className="mt-0.5 block text-[12px] text-black/85">
                            {p.priceFrom ? "from " : ""}
                            {formatPrice(p.price)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>

      <Link
        href={`/search?q=${encodeURIComponent(q)}`}
        onClick={onNavigate}
        className="border-t border-black/10 bg-white px-5 py-3.5 text-[13px] text-black hover:underline md:px-[30px]"
      >
        Show all results for &ldquo;{q}&rdquo; &rarr;
      </Link>
    </div>
  );
}
