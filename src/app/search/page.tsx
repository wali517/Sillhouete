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
      <h1 className="heading mb-8 text-center text-[25px]">Search</h1>
      {term && (
        <p className="mb-6 text-center text-sm text-black/70">
          {results.length} results for “{q}”
        </p>
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
