import Link from "next/link";
import { notFound } from "next/navigation";
import { getProducts, getProductsByCollection, getCollectionByHandle, getCollections } from "@/lib/db";
import { COLLECTION_DESCRIPTIONS } from "@/data/collection-descriptions";
import { COLLECTION_TITLES } from "@/data/site";
import CollectionViewer from "./CollectionViewer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  const colDoc = await getCollectionByHandle(handle);
  const title =
    colDoc?.title ||
    COLLECTION_TITLES[handle] ||
    handle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { title: `${title} – Sillhouete` };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { handle } = await params;
  const sParams = await searchParams;
  const initialPage = Number(sParams?.page) || 1;
  const isSale = handle === "sale-1" || handle === "sale";
  
  const colDoc = await getCollectionByHandle(handle);
  const products = handle === "1" || handle === "all"
    ? await getProducts()
    : await getProductsByCollection(handle);

  const rawTitle = isSale
    ? "SILLHOUETE SALE"
    : colDoc?.title || COLLECTION_TITLES[handle];

  const title =
    rawTitle ||
    handle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (!rawTitle && !products.length) notFound();

  const descriptionHtml = colDoc?.description || COLLECTION_DESCRIPTIONS[handle] || "";

  return (
    <section className="mx-auto w-full max-w-355 px-3 py-7 sm:px-5 md:px-8 lg:px-10 md:py-9">
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
          initialPage={initialPage}
        />
      ) : (
        <div className="py-20 text-center">
          <p>There are no products in this collection yet.</p>
          <Link href="/" className="btn mt-6">
            Continue shopping
          </Link>
        </div>
      )}

      {descriptionHtml ? (
        <div
          className="mx-auto mt-14 max-w-[1100px] text-[14px] leading-[1.7] text-[#222222] collection-seo-content"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      ) : null}
    </section>
  );
}
