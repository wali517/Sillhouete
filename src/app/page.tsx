
import HeroSlider from "@/components/home/HeroSlider";
import CollectionSection from "@/components/home/CollectionSection";
import MediaGrid from "@/components/home/MediaGrid";
import EventSection from "@/components/home/EventSection";
import InstagramFeed from "@/components/home/InstagramFeed";
import NewsletterSection from "@/components/home/NewsletterSection";
import { HERO_SLIDES } from "@/data/campaigns";
import { getProductsByCollection } from "@/lib/db";

export default async function HomePage() {
  const [maahiII, silkSolids, rahaPret, bestSellers, formals] = await Promise.all([
    getProductsByCollection("maahi-ii-luxury-eid-pret"),
    getProductsByCollection("silk-solids26"),
    getProductsByCollection("raha-eid-pret26"),
    getProductsByCollection("best-sellers"),
    getProductsByCollection("formal-dresses"),
  ]);

  return (
    <>
      <HeroSlider slides={HERO_SLIDES} />

      <CollectionSection
        title="MAAHI II LUXURY EID PRET"
        products={maahiII}
        href="/collections/maahi-ii-luxury-eid-pret"
        totalCount={maahiII.length}
        showNewBadge
      />

      <CollectionSection
        title="Silk Solids'26"
        products={silkSolids}
        href="/collections/silk-solids26"
        totalCount={silkSolids.length}
        showNewBadge
      />

      <CollectionSection
        title="Raha Eid Pret'26"
        products={rahaPret}
        href="/collections/raha-eid-pret26"
        totalCount={rahaPret.length || 8}
        showViewAll
        viewAllRed
      />

      <CollectionSection
        title="Best Sellers"
        products={bestSellers}
        href="/collections/best-sellers"
        totalCount={bestSellers.length || 17}
        showViewAll
      />

      <CollectionSection
        title="Formals"
        products={formals}
        href="/collections/formal-dresses"
        totalCount={formals.length || 67}
        showViewAll
      />

      <MediaGrid />
      <EventSection />
      <InstagramFeed />
      <NewsletterSection />
    </>
  );
}
