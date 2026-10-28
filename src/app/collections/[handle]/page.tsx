import Link from "next/link";
import { notFound } from "next/navigation";
import { COLLECTION_PRODUCTS, allProducts } from "@/data/products";
import { COLLECTION_ARTICLES, DEFAULT_ARTICLE } from "@/data/collection-content";
import { COLLECTION_TITLES } from "@/data/site";
import CollectionViewer from "./CollectionViewer";

type Props = { params: Promise<{ handle: string }> };

export function generateStaticParams() {
  const handles = new Set([
    ...Object.keys(COLLECTION_TITLES),
    ...Object.keys(COLLECTION_PRODUCTS),
  ]);
  return Array.from(handles).map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  const title =
    COLLECTION_TITLES[handle] ||
    handle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { title: `${title} – Sillhouete` };
}

export default async function CollectionPage({ params }: Props) {
  const { handle } = await params;
  const isSale = handle === "sale-1" || handle === "sale";
  const rawTitle = isSale ? "SILLHOUETE SALE" : COLLECTION_TITLES[handle];
  const base = handle === "1" || handle === "all" ? allProducts : COLLECTION_PRODUCTS[handle] ?? [];
  
  // Only show products actually assigned to this collection. Padding sparse collections
  // with unrelated items or synthetic sale prices made product grids inaccurate.
  const products = base;

  const title =
    rawTitle ||
    handle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (!rawTitle && !base.length) notFound();
  const articles = COLLECTION_ARTICLES[handle] ?? DEFAULT_ARTICLE(title);

  return (
    <section className="mx-auto w-full max-w-[1420px] px-3 py-7 sm:px-5 md:px-8 lg:px-10 md:py-9">
      {/* Header section matching screenshots */}
      {isSale ? (
        <header className="mb-8 text-center">
          <h1 className="font-serif text-[26px] md:text-[32px] font-bold uppercase tracking-[0.08em] text-[#111111]">
            SILLHOUETE SALE
          </h1>
          <p className="mt-2 text-[14px] md:text-[15px] font-serif text-[#111111]">
            Sales items will not be return , exchange or refunded.
          </p>
        </header>
      ) : (
        <header className="mb-6 text-center">
          <h1 className="font-serif text-[22px] sm:text-[25px] md:text-[28px] font-medium uppercase tracking-[0.08em] text-[#111111]">
            {title.toUpperCase()}
          </h1>
          <nav
            aria-label="Breadcrumb"
            className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-black/70 font-serif"
          >
            <Link href="/" aria-label="Home" className="hover:text-black">
              <svg
                className="w-3.5 h-3.5 inline-block -mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z" />
              </svg>
            </Link>
            <span aria-hidden="true" className="text-black/40">
              /
            </span>
            <span className="capitalize">{title}</span>
          </nav>
        </header>
      )}

      {products.length ? (
        <CollectionViewer
          title={title}
          initialProducts={products}
          isSalePage={isSale}
        />
      ) : (
        <div className="py-20 text-center">
          <p>There are no products in this collection yet.</p>
          <Link href="/" className="btn mt-6">
            Continue shopping
          </Link>
        </div>
      )}

      <div className="mx-auto mt-14 max-w-[1100px] text-[14px] leading-[1.6]">
        {articles.map((a) => (
          <article key={a.heading} className="mb-8">
            <h2 className="heading mb-3 text-[17px]">{a.heading}</h2>
            {a.paragraphs.map((t) => (
              <p key={t} className="mb-3">
                {t}
              </p>
            ))}
            {a.sub?.map((x) => (
              <div key={x.heading} className="mt-4">
                <h3 className="mb-2 text-[14px] font-semibold">{x.heading}</h3>
                {x.paragraphs.map((t) => (
                  <p key={t} className="mb-3">
                    {t}
                  </p>
                ))}
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
