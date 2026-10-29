import ProductGrid from "@/components/products/ProductGrid";
import { getProducts, searchProducts } from "@/lib/db";
import { allProducts as fallbackProducts } from "@/data/products";
import type { Product } from "@/types";

type Props = { searchParams: Promise<{ q?: string }> };

export const metadata = { title: "Search – Sillhouete" };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const term = q.trim();

  let results: Product[] = [];
  let catalog: Product[] = [];

  try {
    if (term) {
      results = await searchProducts(term);
    }
    catalog = await getProducts();
  } catch (err) {
    console.warn("DB search failed, using fallback:", err);
    if (term) {
      const lower = term.toLowerCase();
      results = fallbackProducts.filter(
        (p) => p.title.toLowerCase().includes(lower) || p.alt.toLowerCase().includes(lower)
      );
    }
    catalog = fallbackProducts;
  }

  // If no DB products yet, use fallback catalog
  if (!catalog || catalog.length === 0) {
    catalog = fallbackProducts;
  }

  return (
    <section className="mx-auto w-full max-w-[1420px] px-2.5 py-10 md:px-10">
      <h1 className="mb-10 text-center text-[24px] font-bold uppercase tracking-[0.08em]">Search</h1>

      <form action="/search" role="search" className="mx-auto mb-10 max-w-[1000px] border-b border-black/10 pb-10">
        <div className="relative">
          <input
            type="search"
            name="q"
            defaultValue={q}
            aria-label="Search"
            autoComplete="off"
            className="search-input h-12 w-full px-3 pr-12 text-[15px] transition-colors"
          />
          <button
            type="submit"
            aria-label="Submit search"
            className="plain-btn absolute inset-y-0 right-0 flex w-12 items-center justify-center"
          >
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeMiterlimit="10">
              <path d="M47.16 28.58A18.58 18.58 0 1 1 28.58 10a18.58 18.58 0 0 1 18.58 18.58ZM54 54 41.94 42" />
            </svg>
          </button>
        </div>
      </form>

      {term && results.length > 0 && (
        <p className="mb-6 text-center text-sm text-black/70">{results.length} results</p>
      )}

      {results.length > 0 ? (
        <ProductGrid products={results} />
      ) : (
        <div className="py-6 text-center">
          <p className="text-sm text-black/70 mb-8">
            {term
              ? `No products found matching “${q}”. Discover our most coveted designer styles below:`
              : "Discover our most coveted luxury bridal, formal, and festive collections below:"}
          </p>
          <div className="text-left">
            <ProductGrid products={catalog.slice(0, 16)} />
          </div>
        </div>
      )}
    </section>
  );
}
