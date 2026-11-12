import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parseDescription } from "@/lib/description";
import AddToCart from "@/components/products/AddToCart";
import ProductReviews from "@/components/products/ProductReviews";
import ProductCard from "@/components/products/ProductCard";
import ProductGallery from "@/components/products/ProductGallery";
import CustomerTestimonials from "@/components/products/CustomerTestimonials";
import KeyActives from "@/components/products/KeyActives";
import ProductVideoReel from "@/components/products/ProductVideoReel";
import { SITE } from "@/data/site";
import { getProductByHandle, getProducts, getSettings } from "@/lib/db";
import type { Product } from "@/types";
import { ChevronRight, Globe, ShieldCheck, Truck, RotateCcw, Share2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  let p = null;
  try {
    p = await getProductByHandle(handle);
  } catch {
    // fallback
  }
  if (!p) return { title: "Product – Sillhouete" };

  const pageTitle = p.handle === "iris-rm-03"
    ? "Iris Royal Blue Shirt & Sharara | Sillhouete"
    : `${p.title} – Pakistani Designer Outfit | Sillhouete`;

  return {
    title: pageTitle,
    description: p.description
      ? p.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").replace(/^\s*Description:\s*/i, "").trim().slice(0, 160)
      : `Shop ${p.title} handcrafted Pakistani designer dress at Sillhouete. Worldwide delivery.`,
    alternates: {
      canonical: `https://sillhouete.com/products/${p.handle}`,
    },
    openGraph: {
      title: p.title,
      description: p.description || p.alt,
      url: `https://sillhouete.com/products/${p.handle}`,
      siteName: "Sillhouete",
      images: [
        {
          url: p.image,
          width: 1000,
          height: 1500,
          alt: p.alt || p.title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.description || p.alt,
      images: [p.image],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  let product: Product | undefined = undefined;
  let settings = null;
  try {
    const [p, s] = await Promise.all([getProductByHandle(handle), getSettings()]);
    product = p;
    settings = s;
  } catch {
    // ignore
  }

  if (!product) notFound();

  if (handle === "camilla") {
    if (!product.videoId) product.videoId = "4mWBAj2s6yU";
    if (!product.sku) product.sku = "RM-2-XS";
  }

  // Related products dynamically loaded from MongoDB
  let related: Product[] = [];
  try {
    const allProds = await getProducts();
    related = allProds.filter((p) => p.handle !== handle).slice(0, 4);
  } catch {
    related = [];
  }

  // Exact JSON-LD structured data as on the real Sillhouete website
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Sillhouete",
        url: "https://sillhouete.com",
        logo: "https://sillhouete.com/cdn/shop/files/sillhouete_logo_1.png",
        sameAs: [
          "https://www.instagram.com/sillhouete.official",
          "https://www.facebook.com/sillhouete.official",
        ],
      },
      {
        "@type": "LocalBusiness",
        name: "Sillhouete Boutique",
        image: "https://sillhouete.com/cdn/shop/files/sillhouete_logo_1.png",
        address: {
          "@type": "PostalAddress",
          streetAddress: "327-B, Street 7, Lane 15",
          addressLocality: "Lahore",
          addressRegion: "Punjab",
          postalCode: "54000",
          addressCountry: "PK",
        },
        telephone: "+92 331 0397865",
        openingHours: "Mo-Su 10:00-20:00",
        priceRange: "$$$",
      },
      {
        "@type": "Product",
        "@id": `/products/${product.handle}#product`,
        name: product.title,
        url: `https://sillhouete.com/products/${product.handle}`,
        description: product.description || product.alt,
        image: product.image,
        sku: product.sku || product.handle,
        brand: { "@type": "Brand", name: "Sillhouete" },
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "PKR",
          availability: "https://schema.org/InStock",
          url: `https://sillhouete.com/products/${product.handle}`,
          seller: { "@type": "Organization", name: "Sillhouete" },
        },
      },
    ],
  };


  // Derive collection breadcrumb
  const description = parseDescription(product.description);
  const mainCatSlug = product.mainCategorySlug;
  const mainCatName = product.mainCategoryName;
  const subCatSlug = product.subcategorySlug;
  const subCatName = product.subcategoryName;

  const rawCategory = product.category || "Best Sellers";
  const isLuxuryPret = rawCategory.toLowerCase().includes("luxury pret");
  const fallbackCollectionName = isLuxuryPret
    ? "Luxury Pret Dresses for Women – Shop Pakistani Ready-to-Wear Online"
    : rawCategory;
  const fallbackCollectionSlug =
    isLuxuryPret ? "luxury-pret" :
    fallbackCollectionName.toLowerCase().includes("formal") ? "formal-dresses" :
    fallbackCollectionName.toLowerCase().includes("maahi") ? "maahi-ii-luxury-eid-pret" :
    fallbackCollectionName.toLowerCase().includes("silk") ? "silk-solids26" :
    fallbackCollectionName.toLowerCase().includes("raha") ? "raha-eid-pret26" :
    "best-sellers";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto w-full max-w-[1440px] px-3.5 py-3 sm:px-6 md:px-10 md:py-8">
        {/* Breadcrumb Navigation: Home > Main Category > Subcategory > Product */}
        <nav
          aria-label="Breadcrumb"
          className="mb-3.5 md:mb-6 flex items-center gap-1.5 md:gap-2 text-[11px] md:text-[12px] text-neutral-600 font-serif overflow-x-auto whitespace-nowrap scrollbar-none pb-0.5"
        >
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          
          {mainCatSlug && mainCatName ? (
            <>
              <span className="text-neutral-400">&gt;</span>
              <Link href={`/collections/${mainCatSlug}`} className="hover:text-black">
                {mainCatName}
              </Link>
            </>
          ) : !subCatSlug ? (
            <>
              <span className="text-neutral-400">&gt;</span>
              <Link href={`/collections/${fallbackCollectionSlug}`} className="hover:text-black truncate max-w-50 sm:max-w-none">
                {fallbackCollectionName}
              </Link>
            </>
          ) : null}

          {subCatSlug && subCatName && (
            <>
              <span className="text-neutral-400">&gt;</span>
              <Link href={`/collections/${subCatSlug}`} className="hover:text-black">
                {subCatName}
              </Link>
            </>
          )}

          <span className="text-neutral-400">&gt;</span>
          <span className="text-black font-medium">
            {product.title}
          </span>
        </nav>

        {/* Main Product Layout:
            Left Column: Sticky Product Image Gallery
            Right Column: Product Info, Options, AddToCart, Descriptions, Size Guide
        */}
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-14 items-start">
          {/* Left Column: Product Image Gallery */}
          <div className="lg:sticky lg:top-4 self-start">
            <ProductGallery product={product} />
          </div>

          {/* Right Column: Product Info, Options, Description & Size Guide */}
          <div className="space-y-4 text-black">
            <div>
              {/* Title matching frame_01_3.0s.jpg */}
              <h1 className="font-serif text-[26px] md:text-[32px] tracking-normal text-[#111111] font-semibold leading-tight">
                {product.title}
              </h1>

              {/* SKU below title matching .product-single__sku from live site */}
              <p className="product-single__sku text-[10px] uppercase tracking-[0.2em] text-black/50 font-black mt-1">
                {product.sku || `${product.handle.toUpperCase()}-XS`}
              </p>
            </div>

            {/* Add to Cart Component with Size, Dupatta, Ad-Ons, Expedite, Slips, Buy It Now, WhatsApp */}
            <AddToCart product={product}>
              <div className="space-y-2.5">
                {/* Price with Shipping note */}
              <div className="mt-2">
                <p className="text-[13px] text-neutral-600">
                  <Link href="/pages/shipping-policy" className="underline hover:text-black">
                    Shipping
                  </Link>{" "}
                  calculated at checkout.
                </p>
              </div>

              {/* World Wide Shipping with globe icon */}
              <div className="mt-2.5 flex items-center gap-2 text-[13px] font-serif text-[#111111]">
                <Globe className="h-4 w-4 text-black stroke-[1.5]" />
                <span>World Wide Shipping</span>
              </div>
              </div>
            </AddToCart>

            {/* Shipping & Making Time */}
            <div className="border-t border-black/10 pt-4 text-xs text-black/85 space-y-1">
              <p>
                <strong>Making Time:</strong> {isLuxuryPret ? "15 – 18" : "18 – 20"} days.
              </p>
              <p>
                <strong>Transit time :</strong>Normal 10–12 days, Express 5–6 days
              </p>
            </div>

            {/* Accordion / FAQ matching real Sillhouete website */}
            <details className="group border-b border-black/10 pb-3 text-xs">
              <summary className="cursor-pointer font-bold uppercase tracking-wider flex justify-between items-center list-none select-none py-1.5 text-black">
                <span>Frequently Ask Questions (FAQS)</span>
                <span className="text-sm font-normal transition-transform group-open:rotate-180">▾</span>
              </summary>
              <div className="mt-3 space-y-3 text-black/85 leading-relaxed">
                <div>
                  <p className="font-bold text-black mb-0.5">Do you deliver worldwide?</p>
                  <p className="text-black/75">Yes we deliver all over the world.</p>
                </div>
                <div>
                  <p className="font-bold text-black mb-0.5">What Is you delivery time?</p>
                  <p className="text-black/75">
                    We provide shipping all over Pakistan through call courier. Deliveries can take 3-5 business days. Bridal Wear delivery times are determined after reviewing your requirements and the season of delivery.
                  </p>
                </div>
                <div>
                  <p className="font-bold text-black mb-0.5">How can I cancel my order?</p>
                  <p className="text-black/75">
                    Ready to deliver orders can be cancelled before they are shipped, however made to order articles cannot be cancelled once advance is paid, If still somebody cancels it the advance payment will not be returned.
                  </p>
                </div>
                <div>
                  <p className="font-bold text-black mb-0.5">How can I make payment ?</p>
                  <p className="text-black/75">
                    For international shipping the payment is accepted through Online transfer, Credit Card, Zelle.
                  </p>
                </div>
                <div>
                  <p className="font-bold text-black mb-0.5">How do you confirm shipping time for made to order?</p>
                  <p className="text-black/75">
                    Delivery time for made to orders totally depends on product and season, however we try our best to accommodate you with the best making time possible. The exact time and shipping date will be conveyed through a sales member.
                  </p>
                </div>
              </div>
            </details>

            {/* Description — the store's real per-product description (price includes, fabric, customization) */}
            <div
              className="product-description pt-2 text-xs leading-relaxed text-black/85 [&_p]:mb-2 [&_strong]:font-bold [&_strong]:text-black [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_li]:mb-0.5"
              dangerouslySetInnerHTML={{ __html: description.bodyHtml }}
            />

            {/* Official or Custom Size Chart */}
            {product.customSizeImage ? (
              <div className="pt-6 space-y-3 font-sans text-center">
                <div className="bg-black text-white py-1.5 text-[14px] font-bold uppercase tracking-wider">
                  Size Chart
                </div>
                <div className="overflow-hidden rounded border border-neutral-200 bg-neutral-50 p-2">
                  <Image
                    src={product.customSizeImage}
                    alt={`${product.title} Size Chart`}
                    width={800}
                    height={1000}
                    className="w-full h-auto object-contain mx-auto"
                  />
                </div>
              </div>
            ) : product.handle === "camilla" ? (
              <div className="pt-6 space-y-4 font-sans text-center">
                <div className="flex items-center justify-center py-1">
                  <Image
                    src={SITE.logo}
                    alt="Sillhouete"
                    width={160}
                    height={50}
                    className="h-10 w-auto object-contain"
                  />
                </div>

                <div className="bg-black text-white py-1.5 text-[14px] font-bold uppercase tracking-wider">
                  Size Chart
                </div>
                <div className="text-[12px] font-bold uppercase tracking-wider text-neutral-800">
                  {product.title.toUpperCase()} &bull; ARTICLE CODE: (RM-02)
                </div>

                <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                  <table className="w-full min-w-[480px] border-collapse border border-neutral-300 text-[12px]">
                    <thead>
                      <tr className="bg-neutral-100 text-black font-bold">
                        <th className="border border-neutral-300 px-3 py-2 text-left">Details</th>
                        <th className="border border-neutral-300 px-3 py-2">Ex Small</th>
                        <th className="border border-neutral-300 px-3 py-2">Small</th>
                        <th className="border border-neutral-300 px-3 py-2">Medium</th>
                        <th className="border border-neutral-300 px-3 py-2">Large</th>
                        <th className="border border-neutral-300 px-3 py-2">Ex Large</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center">
                        <td className="border border-neutral-300 px-3 py-1.5 font-semibold text-left">Bust</td>
                        <td className="border border-neutral-300 px-3 py-1.5">18</td>
                        <td className="border border-neutral-300 px-3 py-1.5">19</td>
                        <td className="border border-neutral-300 px-3 py-1.5">20.5</td>
                        <td className="border border-neutral-300 px-3 py-1.5">22</td>
                        <td className="border border-neutral-300 px-3 py-1.5">23.5</td>
                      </tr>
                      <tr className="text-center">
                        <td className="border border-neutral-300 px-3 py-1.5 font-semibold text-left">Hip</td>
                        <td className="border border-neutral-300 px-3 py-1.5">18.5</td>
                        <td className="border border-neutral-300 px-3 py-1.5">19.5</td>
                        <td className="border border-neutral-300 px-3 py-1.5">22</td>
                        <td className="border border-neutral-300 px-3 py-1.5">23</td>
                        <td className="border border-neutral-300 px-3 py-1.5">24.5</td>
                      </tr>
                      <tr className="text-center">
                        <td className="border border-neutral-300 px-3 py-1.5 font-semibold text-left">Arm Hole</td>
                        <td className="border border-neutral-300 px-3 py-1.5">8</td>
                        <td className="border border-neutral-300 px-3 py-1.5">8.5</td>
                        <td className="border border-neutral-300 px-3 py-1.5">9.5</td>
                        <td className="border border-neutral-300 px-3 py-1.5">10.5</td>
                        <td className="border border-neutral-300 px-3 py-1.5">12</td>
                      </tr>
                      <tr className="text-center">
                        <td className="border border-neutral-300 px-3 py-1.5 font-semibold text-left">Shirt Length</td>
                        <td className="border border-neutral-300 px-3 py-1.5">56</td>
                        <td className="border border-neutral-300 px-3 py-1.5">56</td>
                        <td className="border border-neutral-300 px-3 py-1.5">56</td>
                        <td className="border border-neutral-300 px-3 py-1.5">56</td>
                        <td className="border border-neutral-300 px-3 py-1.5">56</td>
                      </tr>
                      <tr className="text-center">
                        <td className="border border-neutral-300 px-3 py-1.5 font-semibold text-left">HEM</td>
                        <td className="border border-neutral-300 px-3 py-1.5">42</td>
                        <td className="border border-neutral-300 px-3 py-1.5">42</td>
                        <td className="border border-neutral-300 px-3 py-1.5">42</td>
                        <td className="border border-neutral-300 px-3 py-1.5">42</td>
                        <td className="border border-neutral-300 px-3 py-1.5">42</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-black text-white py-1.5 text-[14px] font-bold uppercase tracking-wider mt-4">
                  Trouser Size
                </div>
                <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                  <table className="w-full min-w-[480px] border-collapse border border-neutral-300 text-[12px]">
                    <thead>
                      <tr className="bg-neutral-100 text-black font-bold">
                        <th className="border border-neutral-300 px-3 py-2 text-left">Details</th>
                        <th className="border border-neutral-300 px-3 py-2">Ex Small</th>
                        <th className="border border-neutral-300 px-3 py-2">Small</th>
                        <th className="border border-neutral-300 px-3 py-2">Medium</th>
                        <th className="border border-neutral-300 px-3 py-2">Large</th>
                        <th className="border border-neutral-300 px-3 py-2">Ex Large</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center">
                        <td className="border border-neutral-300 px-3 py-1.5 font-semibold text-left">Waist</td>
                        <td className="border border-neutral-300 px-3 py-1.5">14</td>
                        <td className="border border-neutral-300 px-3 py-1.5">15</td>
                        <td className="border border-neutral-300 px-3 py-1.5">17</td>
                        <td className="border border-neutral-300 px-3 py-1.5">19</td>
                        <td className="border border-neutral-300 px-3 py-1.5">19.5</td>
                      </tr>
                      <tr className="text-center">
                        <td className="border border-neutral-300 px-3 py-1.5 font-semibold text-left">Sharara Length</td>
                        <td className="border border-neutral-300 px-3 py-1.5">45</td>
                        <td className="border border-neutral-300 px-3 py-1.5">45</td>
                        <td className="border border-neutral-300 px-3 py-1.5">45</td>
                        <td className="border border-neutral-300 px-3 py-1.5">46</td>
                        <td className="border border-neutral-300 px-3 py-1.5">46</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : description.images.length > 0 ? (
              <div className="pt-6 space-y-4 text-center">
                <div className="relative mx-auto w-full max-w-lg aspect-[2/3] overflow-hidden">
                  <Image
                    src={description.images[0]}
                    alt={`${product.title} size chart`}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            ) : null}

            {/* Disclaimer & Social Share Links matching real Sillhouete site */}
            <div className="border-t border-black/10 pt-4 space-y-3 font-serif">
              <div className="product-block pr-cstm">
                <p className="text-[12px] text-black leading-snug">
                  <strong className="font-bold mr-1">Disclaimer:</strong>
                  Product color may slightly vary due to photographic lighting sources or your monitor setting.
                </p>
              </div>

              <div className="product-block sharing pt-1">
                <div className="flex items-center gap-6 text-[13px] text-black">
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://www.facebook.com/sharer.php?u=https://sillhouete.com/products/${product.handle}`}
                    className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                    title="Share on Facebook"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 14222 14222">
                      <path d="M14222 7112c0 3549.352-2600.418 6491.344-6000 7024.72V9168h1657l315-2056H8222V5778c0-562 275-1111 1159-1111h897V2917s-814-139-1592-139c-1624 0-2686 984-2686 2767v1567H4194v2056h1806v4968.72C2600.418 13603.344 0 10661.352 0 7112 0 3184.703 3183.703 1 7111 1s7111 3183.703 7111 7111Z"/>
                    </svg>
                    <span>Share</span>
                  </a>

                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://twitter.com/share?text=${encodeURIComponent(product.title)}&url=https://sillhouete.com/products/${product.handle}`}
                    className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                    title="Tweet on X"
                  >
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M11.095 5.514c.1-.167.158-.3.249-.409A986.714 986.714 0 0 1 14.67 1.11c.43-.514.876-.614 1.35-.327.53.32.609.932.166 1.485-.477.598-.978 1.178-1.467 1.766-.772.927-1.538 1.862-2.322 2.78-.184.216-.21.358-.038.609 2.158 3.157 4.304 6.323 6.448 9.49.18.266.345.55.463.845.435 1.093-.138 2.07-1.319 2.157-1.61.118-3.226.142-4.829-.11-.95-.15-1.607-.758-2.13-1.513-1.15-1.66-2.28-3.334-3.42-5.002-.071-.105-.155-.203-.289-.377-.086.124-.14.214-.207.295a4455.405 4455.405 0 0 1-4.44 5.31 3.698 3.698 0 0 1-.387.42c-.351.308-.85.304-1.217.008-.353-.286-.466-.811-.194-1.194.352-.495.75-.96 1.139-1.43 1.328-1.6 2.66-3.2 4-4.79.184-.219.16-.371.011-.59a1936.237 1936.237 0 0 1-5.324-7.87c-.205-.304-.4-.63-.533-.97C-.27 1.092.28.095 1.357.045c1.514-.07 3.037-.046 4.553.008 1.13.04 1.915.732 2.532 1.62.791 1.14 1.57 2.287 2.354 3.43.066.096.136.19.297.414l.002-.003Zm-8.888-3.6c.098.168.16.293.237.407 3.38 4.967 6.762 9.933 10.14 14.903.331.487.757.792 1.357.804 1.004.017 2.008.028 3.011.037.065 0 .13-.039.24-.076-.113-.184-.205-.345-.309-.5-2.271-3.352-4.54-6.706-6.816-10.054-1.101-1.62-2.224-3.227-3.324-4.847-.337-.495-.8-.693-1.37-.702-.897-.011-1.793-.02-2.69-.024-.138 0-.276.029-.473.05l-.003.002Z"/>
                    </svg>
                    <span>Share</span>
                  </a>

                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://pinterest.com/pin/create/button/?url=https://sillhouete.com/products/${product.handle}&media=${encodeURIComponent(product.image)}&description=${encodeURIComponent(product.title)}`}
                    className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                    title="Pin on Pinterest"
                  >
                    <svg className="h-4 w-4 fill-[#bd081c]" viewBox="0 0 256 256">
                      <path d="M0 128.002c0 52.414 31.518 97.442 76.619 117.239-.36-8.938-.064-19.668 2.228-29.393 2.461-10.391 16.47-69.748 16.47-69.748s-4.089-8.173-4.089-20.252c0-18.969 10.994-33.136 24.686-33.136 11.643 0 17.268 8.745 17.268 19.217 0 11.704-7.465 29.211-11.304 45.426-3.207 13.578 6.808 24.653 20.203 24.653 24.252 0 40.586-31.149 40.586-68.055 0-28.054-18.895-49.052-53.262-49.052-38.828 0-63.017 28.956-63.017 61.3 0 11.152 3.288 19.016 8.438 25.106 2.368 2.797 2.697 3.922 1.84 7.134-.614 2.355-2.024 8.025-2.608 10.272-.852 3.242-3.479 4.401-6.409 3.204-17.884-7.301-26.213-26.886-26.213-48.902 0-36.361 30.666-79.961 91.482-79.961 48.87 0 81.035 35.364 81.035 73.325 0 50.213-27.916 87.726-69.066 87.726-13.819 0-26.818-7.47-31.271-15.955 0 0-7.431 29.492-9.005 35.187-2.714 9.869-8.026 19.733-12.883 27.421a127.897 127.897 0 0 0 36.277 5.249c70.684 0 127.996-57.309 127.996-128.005C256.001 57.309 198.689 0 128.005 0 57.314 0 0 57.309 0 128.002Z"/>
                    </svg>
                    <span>Pin it</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products Section matching real site */}
        <section className="mt-20 pt-8">
          <div className="mb-8 text-center">
            <h2 className="heading text-[22px] md:text-[26px] uppercase tracking-[0.2em] text-[#111111]">
              Similar Products
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-[17px]">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} isNew={true} />
            ))}
          </div>
        </section>

        {/* Customer Reviews Component (First as requested) */}
        <ProductReviews productTitle={product.title} />

        {/* Let Customers Speak For Us (After reviews as requested) */}
        <CustomerTestimonials />

        {/* Key Actives Section */}
        <KeyActives />

        {/* Floating Product Video Reel matching real website */}
        <ProductVideoReel
          videoId={product.videoId}
          videoUrl={product.videoUrl}
          defaultVideoUrl={settings?.defaultProductVideoUrl}
          productTitle={product.title}
        />
      </div>
    </>
  );
}
