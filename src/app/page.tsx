import HeroSlider from "@/components/home/HeroSlider";
import CollectionSection from "@/components/home/CollectionSection";
import MediaGrid from "@/components/home/MediaGrid";
import EventSection from "@/components/home/EventSection";
import InstagramFeed from "@/components/home/InstagramFeed";
import NewsletterSection from "@/components/home/NewsletterSection";
import { HERO_SLIDES } from "@/data/campaigns";
import { getProducts } from "@/lib/db";
import { runSeedIfEmpty } from "@/lib/seed";
import type { Product } from "@/types";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function HomePage() {
  // Ensure DB is seeded
  await runSeedIfEmpty();

  // Fetch all products from MongoDB
  const allProducts = await getProducts();

  // Group by category/collection for homepage sections
  const byCategory = (cat: string) =>
    allProducts.filter((p) => p.category?.toLowerCase().includes(cat.toLowerCase())).slice(0, 8);

  const maahiII = allProducts.filter((p) => p.handle?.includes("maahi") || p.handle?.includes("eid-pret")).slice(0, 8);
  const silkSolids = allProducts.filter((p) => p.handle?.includes("silk") || p.handle?.includes("solid")).slice(0, 8);
  const rahaPret = allProducts.filter((p) => p.handle?.includes("raha")).slice(0, 8);
  const bestSellers = allProducts.filter((p) => p.isBestSeller).slice(0, 8);
  const formals = byCategory("formal").slice(0, 8);

  // Fallbacks: if filters return empty, use first products
  const getSection = (specific: Product[], fallbackSlice: [number, number]) =>
    specific.length > 0 ? specific : allProducts.slice(fallbackSlice[0], fallbackSlice[1]);

  return (
    <>
      <HeroSlider slides={HERO_SLIDES} />
      <CollectionSection
        title="MAAHI II LUXURY EID PRET"
        products={getSection(maahiII, [0, 8])}
        href="/collections/maahi-ii-luxury-eid-pret"
        totalCount={maahiII.length || allProducts.length}
      />
      <CollectionSection
        title="Silk Solids'26"
        products={getSection(silkSolids, [8, 16])}
        href="/collections/silk-solids26"
        totalCount={silkSolids.length || allProducts.length}
      />
      <CollectionSection
        title="Raha Eid Pret'26"
        products={getSection(rahaPret, [16, 24])}
        href="/collections/raha-eid-pret26"
        totalCount={rahaPret.length || 8}
      />
      <CollectionSection
        title="Best Sellers"
        products={getSection(bestSellers, [24, 32])}
        href="/collections/best-sellers"
        totalCount={bestSellers.length || allProducts.length}
      />
      <CollectionSection
        title="Formals"
        products={getSection(formals, [32, 40])}
        href="/collections/formal-dresses"
        totalCount={formals.length || allProducts.length}
      />
      <MediaGrid />
      <EventSection />
      <InstagramFeed />
      <NewsletterSection />
    </>
  );
}
