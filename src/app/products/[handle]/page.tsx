import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "@/components/products/AddToCart";
import ProductReviews from "@/components/products/ProductReviews";
import ProductCard from "@/components/products/ProductCard";
import ProductGallery from "@/components/products/ProductGallery";
import ProductPriceDisplay from "@/components/products/ProductPriceDisplay";
import CustomerTestimonials from "@/components/products/CustomerTestimonials";
import KeyActives from "@/components/products/KeyActives";
import ProductVideoReel from "@/components/products/ProductVideoReel";
import { allProducts, getProduct } from "@/data/products";
import { SEED_BLOGS } from "@/data/seed-blogs";
import { ChevronRight, Star, Globe, ShieldCheck, Truck, RotateCcw, Share2 } from "lucide-react";

type Props = { params: Promise<{ handle: string }> };

export function generateStaticParams() {
  return allProducts.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  const p = getProduct(handle);
  if (!p) return { title: "Product – Sillhouete" };

  const pageTitle = p.handle === "iris-rm-03"
    ? "Iris Royal Blue Shirt & Sharara | Sillhouete"
    : `${p.title} – Pakistani Designer Outfit | Sillhouete`;

  return {
    title: pageTitle,
    description: p.description
      ? p.description.slice(0, 160)
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
  const product = getProduct(handle);
  if (!product) notFound();

  // Related products
  const related = allProducts.filter((p) => p.handle !== handle).slice(0, 4);

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

  const rating = product.rating || 5.0;
  const reviewCount = product.reviewCount || 62;

  // Derive collection breadcrumb
  const collectionName = product.category || "Best Sellers";
  const collectionSlug =
    collectionName.toLowerCase().includes("formal") ? "formal-dresses" :
    collectionName.toLowerCase().includes("maahi") ? "maahi-ii-luxury-eid-pret" :
    collectionName.toLowerCase().includes("silk") ? "silk-solids26" :
    collectionName.toLowerCase().includes("raha") ? "raha-eid-pret26" :
    "best-sellers";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 md:px-10 md:py-8">
        {/* Breadcrumb Navigation matching real site: Home > Collection > [Product Title] */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-[12px] text-black/70"
        >
          <Link href="/" className="hover:text-black hover:underline">
            Home
          </Link>
          <span>&gt;</span>
          <Link href={`/collections/${collectionSlug}`} className="hover:text-black hover:underline">
            {collectionName}
          </Link>
          <span>&gt;</span>
          <span className="font-semibold text-black">
            {product.title}
          </span>
        </nav>

        {/* Main Product Layout:
            Left Column: Sticky Product Image Gallery
            Right Column: Product Info, Options, AddToCart, Descriptions, Size Guide
            Behavior: Left image stays fixed as user scrolls right side, then both slide up together!
        */}
        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14 items-start">
          {/* Left Column: Product Image Gallery (Sticks when touching screen border until right side finishes) */}
          <div className="lg:sticky lg:top-0 self-start">
            <ProductGallery product={product} />
          </div>

          {/* Right Column: Product Info, Options, Description & Size Guide */}
          <div className="space-y-5 text-black">
            <div>
              {/* Title matching real site: Uppercase Serif */}
              <h1 className="font-serif text-[26px] md:text-[32px] tracking-wide uppercase text-[#111111] font-semibold">
                {product.title}
              </h1>

              {/* SKU below title */}
              <p className="text-[11px] uppercase tracking-wider text-black/50 mt-1 font-mono">
                {product.sku || `${product.handle.toUpperCase()}-XS`}
              </p>

              {/* Price */}
              <div className="mt-3">
                <ProductPriceDisplay
                  price={product.price}
                  originalPrice={product.originalPrice}
                  priceFrom={product.priceFrom}
                />
                <p className="mt-1 text-xs text-black/60">
                  Shipping calculated at checkout.
                </p>
              </div>

              {/* Worldwide Shipping pill */}
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-black/80">
                <Globe className="h-4 w-4 text-black/70" />
                <span>World Wide Shipping</span>
              </div>
            </div>

            {/* Add to Cart Component with Size, Dupatta, Ad-Ons, Expedite, Slips, Buy It Now, WhatsApp */}
            <AddToCart product={product} />

            {/* Shipping & Making Time */}
            <div className="border-t border-black/10 pt-4 text-xs text-black/85 space-y-1">
              <p>
                <strong>Making Time:</strong> 18 – 20 days.
              </p>
              <p>
                <strong>Transit time :</strong>Normal 10–12 days, Express 5–6 days
              </p>
            </div>

            {/* Accordion / FAQ */}
            <details className="group border-b border-black/10 pb-3 text-xs">
              <summary className="cursor-pointer font-bold uppercase tracking-wider flex justify-between items-center list-none select-none py-1 text-black">
                <span>Frequently Ask Questions (FAQS)</span>
                <span className="text-sm font-normal transition-transform group-open:rotate-180">▾</span>
              </summary>
              <div className="mt-2.5 space-y-2 text-black/75 leading-relaxed">
                <p>
                  <strong>Worldwide Delivery:</strong> We ship worldwide with DHL Express &amp; FedEx courier partners.
                </p>
                <p>
                  <strong>Custom Sizing:</strong> All outfits can be custom tailored to your exact measurements. Select &quot;Custom Size&quot; and provide notes during checkout.
                </p>
              </div>
            </details>

            {/* Description matching real site */}
            <div className="pt-2 text-xs leading-relaxed space-y-3">
              <div>
                <strong className="block font-bold uppercase tracking-wider text-xs mb-1.5 text-black">
                  Description:
                </strong>
                <p className="text-black/80">
                  {product.description ||
                    `${product.title} is an exquisite haute couture ensemble featuring refined hand-embellishment with Swarovski crystals, shimmering naqshi, fine dabka, and delicate sequins. Paired with tailored matching trousers and a regal flowing dupatta, it exudes timeless sophistication.`}
                </p>
              </div>

              {/* Fabric Detail */}
              <div>
                <strong className="block font-bold uppercase tracking-wider text-xs mb-1 text-black">
                  Fabric Detail:
                </strong>
                <ul className="list-disc list-inside space-y-0.5 text-black/80">
                  <li>Shirt: {product.fabricDetail?.shirt || "Net"}</li>
                  <li>Pants: {product.fabricDetail?.trousers || "PK Rawsilk"}</li>
                  <li>Bustier top/Lining: PK Rawsilk</li>
                  <li>Dupatta: {product.fabricDetail?.dupatta || "Organza Dupatta + Patches"}</li>
                </ul>
              </div>

              {/* Price Includes */}
              <div>
                <p className="text-black/90">
                  <strong>Price Includes:</strong> {product.priceIncludes?.join(", ") || "Shirt, Bustier top & Pants."}
                </p>
              </div>

              {/* Size Customization details */}
              <div className="space-y-0.5 text-black/80">
                <p><strong>Size Customization:</strong> Yes</p>
                <p><strong>Colour Customization:</strong> No</p>
              </div>
            </div>

            {/* Authentic Garment Size Guide Tables (Shirt & Trouser) matching frames 24 & 25 */}
            <div className="border-t border-black/10 pt-5 space-y-5">
              <div>
                <h3 className="font-bold uppercase tracking-wider text-xs mb-2.5 text-black">
                  Shirt Size (Inches)
                </h3>
                <div className="overflow-x-auto border border-black/15">
                  <table className="w-full text-center text-xs">
                    <thead className="bg-[#f7f7f7] border-b border-black/15 font-bold uppercase text-[11px]">
                      <tr>
                        <th className="p-2 border-r border-black/10">Size</th>
                        <th className="p-2 border-r border-black/10">Length</th>
                        <th className="p-2 border-r border-black/10">Chest</th>
                        <th className="p-2 border-r border-black/10">Waist</th>
                        <th className="p-2 border-r border-black/10">Hip</th>
                        <th className="p-2 border-r border-black/10">Shoulder</th>
                        <th className="p-2">Sleeves</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10 text-black/80">
                      <tr>
                        <td className="p-2 font-bold border-r border-black/10 bg-[#fafafa]">XS</td>
                        <td className="p-2 border-r border-black/10">48</td>
                        <td className="p-2 border-r border-black/10">18</td>
                        <td className="p-2 border-r border-black/10">15.5</td>
                        <td className="p-2 border-r border-black/10">19.5</td>
                        <td className="p-2 border-r border-black/10">14</td>
                        <td className="p-2">22.5</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold border-r border-black/10 bg-[#fafafa]">S</td>
                        <td className="p-2 border-r border-black/10">48</td>
                        <td className="p-2 border-r border-black/10">19.5</td>
                        <td className="p-2 border-r border-black/10">17</td>
                        <td className="p-2 border-r border-black/10">21</td>
                        <td className="p-2 border-r border-black/10">14.5</td>
                        <td className="p-2">23</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold border-r border-black/10 bg-[#fafafa]">M</td>
                        <td className="p-2 border-r border-black/10">48</td>
                        <td className="p-2 border-r border-black/10">21</td>
                        <td className="p-2 border-r border-black/10">18.5</td>
                        <td className="p-2 border-r border-black/10">22.5</td>
                        <td className="p-2 border-r border-black/10">15</td>
                        <td className="p-2">23</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold border-r border-black/10 bg-[#fafafa]">L</td>
                        <td className="p-2 border-r border-black/10">48</td>
                        <td className="p-2 border-r border-black/10">23</td>
                        <td className="p-2 border-r border-black/10">20.5</td>
                        <td className="p-2 border-r border-black/10">24.5</td>
                        <td className="p-2 border-r border-black/10">15.5</td>
                        <td className="p-2">23</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold border-r border-black/10 bg-[#fafafa]">XL</td>
                        <td className="p-2 border-r border-black/10">48</td>
                        <td className="p-2 border-r border-black/10">24.5</td>
                        <td className="p-2 border-r border-black/10">22.5</td>
                        <td className="p-2 border-r border-black/10">26</td>
                        <td className="p-2 border-r border-black/10">16</td>
                        <td className="p-2">23</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-bold uppercase tracking-wider text-xs mb-2.5 text-black">
                  Trouser Size (Inches)
                </h3>
                <div className="overflow-x-auto border border-black/15">
                  <table className="w-full text-center text-xs">
                    <thead className="bg-[#f7f7f7] border-b border-black/15 font-bold uppercase text-[11px]">
                      <tr>
                        <th className="p-2 border-r border-black/10">Size</th>
                        <th className="p-2 border-r border-black/10">Waist</th>
                        <th className="p-2 border-r border-black/10">Thigh</th>
                        <th className="p-2 border-r border-black/10">Bottom (Half)</th>
                        <th className="p-2">Trouser Lengths</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10 text-black/80">
                      <tr>
                        <td className="p-2 font-bold border-r border-black/10 bg-[#fafafa]">XS</td>
                        <td className="p-2 border-r border-black/10">14</td>
                        <td className="p-2 border-r border-black/10">11</td>
                        <td className="p-2 border-r border-black/10">25</td>
                        <td className="p-2">43</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold border-r border-black/10 bg-[#fafafa]">S</td>
                        <td className="p-2 border-r border-black/10">15</td>
                        <td className="p-2 border-r border-black/10">12</td>
                        <td className="p-2 border-r border-black/10">25</td>
                        <td className="p-2">43</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold border-r border-black/10 bg-[#fafafa]">M</td>
                        <td className="p-2 border-r border-black/10">17</td>
                        <td className="p-2 border-r border-black/10">13</td>
                        <td className="p-2 border-r border-black/10">25</td>
                        <td className="p-2">44</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold border-r border-black/10 bg-[#fafafa]">L</td>
                        <td className="p-2 border-r border-black/10">19</td>
                        <td className="p-2 border-r border-black/10">14</td>
                        <td className="p-2 border-r border-black/10">25</td>
                        <td className="p-2">44</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold border-r border-black/10 bg-[#fafafa]">XL</td>
                        <td className="p-2 border-r border-black/10">19.5</td>
                        <td className="p-2 border-r border-black/10">16</td>
                        <td className="p-2 border-r border-black/10">25</td>
                        <td className="p-2">45</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Disclaimer & Social Share Links */}
            <div className="border-t border-black/10 pt-4 space-y-3">
              <p className="text-xs text-black/70 italic">
                <strong>Disclaimer:</strong> Product color may slightly vary due to photographic lighting sources or your monitor setting.
              </p>

              <div className="flex items-center gap-6 pt-1 text-xs font-semibold text-black/80">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=https://sillhouete.com/products/${product.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-black transition-colors"
                >
                  <span className="font-bold font-serif">f</span>
                  <span>Share</span>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=https://sillhouete.com/products/${product.handle}&text=${encodeURIComponent(product.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-black transition-colors"
                >
                  <span className="font-bold">𝕏</span>
                  <span>Share</span>
                </a>
                <a
                  href={`https://pinterest.com/pin/create/button/?url=https://sillhouete.com/products/${product.handle}&media=${encodeURIComponent(product.image)}&description=${encodeURIComponent(product.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-black transition-colors"
                >
                  <span className="font-bold font-serif text-red-600">P</span>
                  <span>Pin it</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products Section matching real site */}
        <section className="mt-20 border-t border-black/10 pt-12">
          <div className="mb-8 text-center">
            <h2 className="heading text-[22px] md:text-[26px] uppercase tracking-[0.2em] text-[#111111]">
              Similar Products
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-[10px] md:grid-cols-4 md:gap-[17px]">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* Editorial Journal Insights */}
        <section className="mt-16 border-t border-black/10 pt-10">
          <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#9b8065]">Sillhouete Journal</span>
              <h2 className="heading text-[20px] md:text-[24px]">Styling &amp; Bridal Insights</h2>
            </div>
            <Link href="/blogs/news" className="text-xs uppercase font-bold tracking-wider hover:underline text-black">
              View All Stories &rarr;
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {SEED_BLOGS.map((blog) => (
              <div key={blog.id} className="group border border-black/10 bg-white overflow-hidden">
                <Link href={`/blogs/news/${blog.slug}`} className="relative aspect-[16/10] block overflow-hidden">
                  <Image
                    src={blog.coverImage}
                    alt={blog.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                <div className="p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#9b8065]">{blog.category}</span>
                  <h3 className="heading text-[14px] leading-snug line-clamp-2">
                    <Link href={`/blogs/news/${blog.slug}`} className="hover:underline">{blog.title}</Link>
                  </h3>
                  <p className="text-xs text-black/60 line-clamp-2">{blog.excerpt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Let Customers Speak For Us */}
        <CustomerTestimonials />

        {/* Key Actives Section */}
        <KeyActives />

        {/* Floating Product Video Reel matching real website */}
        <ProductVideoReel
          videoId={product.videoId}
          videoUrl={product.videoUrl}
          productTitle={product.title}
        />
      </div>
    </>
  );
}
