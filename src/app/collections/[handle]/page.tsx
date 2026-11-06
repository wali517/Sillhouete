import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProducts,
  getProductsByCollection,
  getCollectionByHandle,
  getSubcategories,
} from "@/lib/db";
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
  const products =
    handle === "1" || handle === "all"
      ? await getProducts()
      : await getProductsByCollection(handle);

  const rawTitle = isSale
    ? "SILLHOUETE SALE"
    : colDoc?.title || COLLECTION_TITLES[handle];

  const title =
    rawTitle ||
    handle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (!rawTitle && !products.length) notFound();

  // Determine hierarchy: is this a Subcategory or a Main Category?
  const parentHandle = colDoc?.parentHandle?.trim() || "";
  let parentDoc = null;
  let subcategoriesNav: Array<{ handle: string; title: string }> = [];

  if (parentHandle) {
    // 1. Current page is a SUBCATEGORY
    parentDoc = await getCollectionByHandle(parentHandle);
    // Fetch sibling subcategories under the same parent
    const siblings = await getSubcategories(parentHandle, true);
    subcategoriesNav = siblings.map((s) => ({ handle: s.handle, title: s.title }));
  } else {
    // 2. Current page is a MAIN CATEGORY
    const childSubs = await getSubcategories(handle, true);
    subcategoriesNav = childSubs.map((s) => ({ handle: s.handle, title: s.title }));
  }

  const descriptionHtml = colDoc?.description || COLLECTION_DESCRIPTIONS[handle] || "";

  return (
    <section className="mx-auto w-full max-w-355 px-3 py-7 sm:px-5 md:px-8 lg:px-10 md:py-9">
      {/* Header section matching Sillhouete aesthetic */}
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

          {/* Breadcrumbs: Home > (Main Category) > Subcategory */}
          <nav
            aria-label="Breadcrumb"
            className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-black/70 font-serif flex-wrap"
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

            {parentDoc && (
              <>
                <span aria-hidden="true" className="text-black/40">
                  /
                </span>
                <Link
                  href={`/collections/${parentDoc.handle}`}
                  className="hover:text-black capitalize text-black/60 hover:underline"
                >
                  {parentDoc.title}
                </Link>
              </>
            )}

            <span aria-hidden="true" className="text-black/40">
              /
            </span>
            <span className="capitalize font-medium text-black">{title}</span>
          </nav>

          {/* Subcategory Filter Navigation Pills */}
          {subcategoriesNav.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {parentDoc ? (
                <Link
                  href={`/collections/${parentDoc.handle}`}
                  className="rounded-full border border-gray-300 px-3.5 py-1 text-xs font-serif uppercase tracking-wider text-gray-600 hover:border-black hover:text-black transition-colors"
                >
                  All {parentDoc.title}
                </Link>
              ) : (
                <span className="rounded-full bg-black px-3.5 py-1 text-xs font-serif uppercase tracking-wider text-white shadow-xs">
                  All
                </span>
              )}

              {subcategoriesNav.map((sub) => {
                const isCurrent = sub.handle === handle;
                return isCurrent ? (
                  <span
                    key={sub.handle}
                    className="rounded-full bg-black px-3.5 py-1 text-xs font-serif uppercase tracking-wider text-white shadow-xs"
                  >
                    {sub.title}
                  </span>
                ) : (
                  <Link
                    key={sub.handle}
                    href={`/collections/${sub.handle}`}
                    className="rounded-full border border-gray-300 px-3.5 py-1 text-xs font-serif uppercase tracking-wider text-gray-600 hover:border-black hover:text-black transition-colors"
                  >
                    {sub.title}
                  </Link>
                );
              })}
            </div>
          )}
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
          <p className="text-gray-500 font-serif">There are no products in this collection yet.</p>
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
