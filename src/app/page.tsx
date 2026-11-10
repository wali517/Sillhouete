import HeroSlider from "@/components/home/HeroSlider";
import CollectionSection from "@/components/home/CollectionSection";
import MediaGrid from "@/components/home/MediaGrid";
import EventSection from "@/components/home/EventSection";
import InstagramFeed from "@/components/home/InstagramFeed";
import NewsletterSection from "@/components/home/NewsletterSection";
import { HERO_SLIDES } from "@/data/campaigns";
import { getProductsByCollection, getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The exact original 5 homepage collections
const HOMEPAGE_SECTIONS = [
  {
    handle: "maahi-ii-luxury-eid-pret",
    title: "MAAHI II LUXURY EID PRET",
    hideViewAll: true,
    showNewBadge: true,
    viewAllRed: false,
  },
  {
    handle: "silk-solids26",
    title: "Silk Solids'26",
    hideViewAll: true,
    showNewBadge: true,
    viewAllRed: false,
  },
  {
    handle: "raha-eid-pret26",
    title: "Raha Eid Pret'26",
    hideViewAll: false,
    showNewBadge: false,
    viewAllRed: true,
  },
  {
    handle: "best-sellers",
    title: "Best Sellers",
    hideViewAll: false,
    showNewBadge: false,
    viewAllRed: false,
  },
  {
    handle: "formal-dresses",
    title: "Formals",
    hideViewAll: false,
    showNewBadge: false,
    viewAllRed: false,
  },
];

export default async function HomePage() {
  // Fetch site settings (for dynamic campaign video) and products concurrently from MongoDB
  const [settings, sections] = await Promise.all([
    getSettings(),
    Promise.all(
      HOMEPAGE_SECTIONS.map(async (sec) => {
        const products = await getProductsByCollection(sec.handle);
        return {
          ...sec,
          products,
        };
      })
    ),
  ]);

  return (
    <>
      <HeroSlider slides={HERO_SLIDES} />

      {/* Only the original 5 homepage category sections */}
      {sections.map((sec) => (
        <CollectionSection
          key={sec.handle}
          title={sec.title}
          products={sec.products}
          href={`/collections/${sec.handle}`}
          totalCount={sec.products.length}
          showNewBadge={sec.showNewBadge}
          hideViewAll={sec.hideViewAll}
          showViewAll={!sec.hideViewAll}
          viewAllRed={sec.viewAllRed}
        />
      ))}

      <MediaGrid videoSrc={settings.campaignVideoUrl} />
      <EventSection />
      <InstagramFeed />
      <NewsletterSection />
    </>
  );
}
