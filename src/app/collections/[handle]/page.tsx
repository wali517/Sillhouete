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
    <section className="mx-auto w-full max-w-[1520px] px-3.5 py-6 sm:px-6 md:px-8 lg:px-10 md:py-8">
      {/* Header section matching Sillhouete aesthetic */}
      {isSale ? (
        <header className="mb-8 text-center">
          <h1 className="font-serif text-[26px] md:text-[24px] font-bold uppercase tracking-[0.02em] text-[#111111]">
            SILLHOUETE SALE
          </h1>
          <p className="mt-2 text-[14px] md:text-[15px] font-serif text-[#111111]">
            Sales items will not be return , exchange or refunded.
          </p>
        </header>
      ) : (
        <header className="mb-6">
          <h1 className="font-serif text-[22px] sm:text-[24px] md:text-[26px] font-normal uppercase tracking-[0.02em] text-[#111111] text-center mb-16 md:mb-24 mt-2 md:mt-6">
            {title.toUpperCase()}
          </h1>

          {/* Breadcrumbs: Left-aligned matching Image 1 */}
          <nav
            aria-label="Breadcrumb"
            className="mb-2 flex items-center gap-2 text-[12px] sm:text-[16px] text-[#666666] font-serif"
          >
            <Link href="/" aria-label="Home" className="text-[#666666] hover:text-black transition-colors flex items-center">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path
                  d="M2 6L8 1L14 6V13C14 13.5304 13.7893 14.0391 13.4142 14.4142C13.0391 14.7893 12.5304 15 12 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V6Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M6 15V8H10V15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            {parentDoc && (
              <>
                <span aria-hidden="true" className="text-[#999999]">
                  /
                </span>
                <Link
                  href={`/collections/${parentDoc.handle}`}
                  className="hover:text-black capitalize text-[#666666] hover:underline"
                >
                  {parentDoc.title}
                </Link>
              </>
            )}

            <span aria-hidden="true" className="text-[#999999]">
              /
            </span>
            <span className="capitalize font-normal text-black">{title}</span>
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
