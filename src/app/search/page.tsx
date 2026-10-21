import ProductGrid from "@/components/products/ProductGrid";
import { allProducts } from "@/data/products";

type Props = { searchParams: Promise<{ q?: string }> };

export const metadata = { title: "Search – Sillhouete" };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const term = q.trim().toLowerCase();
  const results = term ? allProducts.filter((p) => p.title.toLowerCase().includes(term) || p.alt.toLowerCase().includes(term)) : [];
  return (
    <section className="mx-auto w-full max-w-[1420px] px-2.5 py-10 md:px-10">
      <h1 className="heading mb-8 text-center text-[25px]">Search</h1>
      {term && <p className="mb-6 text-center">{results.length} results for “{q}”</p>}
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
            <ProductGrid products={allProducts.slice(0, 16)} />
          </div>
        </div>
      )}
    </section>
  );
}
