import Link from "next/link";
import { notFound } from "next/navigation";
import { COLLECTION_ARTICLES, DEFAULT_ARTICLE } from "@/data/collection-content";
import { COLLECTION_TITLES } from "@/data/site";
import { getProducts } from "@/lib/db";
import { runSeedIfEmpty } from "@/lib/seed";
import CollectionViewer from "./CollectionViewer";

type Props = { params: Promise<{ handle: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  const title =
    COLLECTION_TITLES[handle] ||
    handle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { title: `${title} – Sillhouete` };
}

// Collection → category/handle keyword mapping
const COLLECTION_MAP: Record<string, string[]> = {
  "formal-dresses": ["formal", "rm-"],
  "bridal-dresses": ["bridal", "husan", "anarkali", "noor-jahn", "roshanara"],
  "luxury-pret": ["maahi", "silk", "lumiere", "luxe", "opal", "riwaj"],
  "maahi-ii-luxury-eid-pret": ["maahi"],
  "silk-solids26": ["silk"],
  "raha-eid-pret26": ["raha"],
  "best-sellers": [], // uses isBestSeller flag
  "new-arrivals": [], // uses isNew flag
  "sale-1": [], // uses isSale flag
  pret: ["pret", "raha"],
  accessories: ["accessory", "clutch", "pouch"],
};

export default async function CollectionPage({ params }: Props) {
  const { handle } = await params;
  await runSeedIfEmpty();

  const allProducts = await getProducts();
  const isSale = handle === "sale-1" || handle === "sale";
  const isBestSellers = handle === "best-sellers";
  const isNewArrivals = handle === "new-arrivals";
  const isAll = handle === "1" || handle === "all";

  let products = allProducts;

  if (isSale) {
    products = allProducts.filter((p) => p.isSale || p.originalPrice).map((p) => ({
      ...p,
      isSale: true,
      originalPrice: p.originalPrice || Math.round(p.price * 1.3),
    }));
    // Fill up if not many on sale
    if (products.length < 8) {
      const seen = new Set(products.map((p) => p.id));
      for (const p of allProducts) {
        if (products.length >= 62) break;
        if (!seen.has(p.id)) {
          seen.add(p.id);
          products.push({ ...p, isSale: true, originalPrice: p.originalPrice || Math.round(p.price * 1.3) });
        }
      }
    }
  } else if (isBestSellers) {
    products = allProducts.filter((p) => p.isBestSeller);
    if (products.length < 8) products = allProducts.slice(0, 17);
  } else if (isNewArrivals) {
    products = allProducts.filter((p) => p.isNew);
    if (products.length < 8) products = allProducts.slice(0, 16);
  } else if (!isAll) {
    const keywords = COLLECTION_MAP[handle];
    if (keywords !== undefined) {
      if (keywords.length === 0) {
        products = allProducts.slice(0, 20);
      } else {
        products = allProducts.filter((p) =>
          keywords.some((kw) => p.handle?.toLowerCase().includes(kw) || p.category?.toLowerCase().includes(kw))
        );
      }
    } else {
      // Try matching by category name or handle keyword
      const keyword = handle.replace(/-/g, " ");
      products = allProducts.filter(
        (p) =>
          p.category?.toLowerCase().includes(keyword) ||
          p.handle?.toLowerCase().includes(handle)
      );
    }

    // Fill to minimum 8
    if (products.length < 8) {
      const seen = new Set(products.map((p) => p.id));
      for (const p of allProducts) {
        if (products.length >= 8) break;
        if (!seen.has(p.id)) { seen.add(p.id); products.push(p); }
      }
    }
  }

  const rawTitle = COLLECTION_TITLES[handle];
  const title = rawTitle || handle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (!rawTitle && products.length === 0) notFound();

  const articles = COLLECTION_ARTICLES[handle] ?? DEFAULT_ARTICLE(title);

  return (
    <section className="mx-auto w-full max-w-[1420px] px-2.5 py-8 md:px-10">
      {isSale ? (
        <header className="mb-8 text-center">
          <h1 className="font-serif text-[26px] md:text-[32px] font-bold uppercase tracking-[0.08em] text-[#111111]">
            SILLHOUETE SALE
          </h1>
          <p className="mt-2 text-[14px] md:text-[15px] font-serif text-[#111111]">
            Sales items will not be returned, exchanged, or refunded.
          </p>
        </header>
      ) : (
        <header className="mb-6 text-center">
          <h1 className="font-serif text-[24px] md:text-[28px] font-bold uppercase tracking-[0.06em] text-[#111111]">
            {title.toUpperCase()}
          </h1>
          <nav aria-label="Breadcrumb" className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-black/70 font-serif">
            <Link href="/" aria-label="Home" className="hover:text-black">
              <svg className="w-3.5 h-3.5 inline-block -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z" />
              </svg>
            </Link>
            <span aria-hidden="true" className="text-black/40">/</span>
            <span className="capitalize">{title}</span>
          </nav>
        </header>
      )}

      {products.length ? (
        <CollectionViewer title={title} initialProducts={products} isSalePage={isSale} />
      ) : (
        <div className="py-20 text-center">
          <p>There are no products in this collection yet.</p>
          <Link href="/" className="btn mt-6">Continue shopping</Link>
        </div>
      )}

      <div className="mx-auto mt-14 max-w-[1100px] text-[14px] leading-[1.6]">
        {articles.map((a) => (
          <article key={a.heading} className="mb-8">
            <h2 className="heading mb-3 text-[17px]">{a.heading}</h2>
            {a.paragraphs.map((t) => <p key={t} className="mb-3">{t}</p>)}
            {a.sub?.map((x) => (
              <div key={x.heading} className="mt-4">
                <h3 className="mb-2 text-[14px] font-semibold">{x.heading}</h3>
                {x.paragraphs.map((t) => <p key={t} className="mb-3">{t}</p>)}
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
