import { Suspense } from "react";
import HeroSlider from "@/components/home/HeroSlider";
import CollectionSection from "@/components/home/CollectionSection";
import MediaGrid from "@/components/home/MediaGrid";
import EventSection from "@/components/home/EventSection";
import InstagramFeed from "@/components/home/InstagramFeed";
import NewsletterSection from "@/components/home/NewsletterSection";
import {
  CollectionSectionSkeleton,
  MediaGridSkeleton,
} from "@/components/ui/Skeletons";
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

async function AsyncCollectionSection({
  sec,
}: {
  sec: (typeof HOMEPAGE_SECTIONS)[number];
}) {
  const products = await getProductsByCollection(sec.handle, {
    limit: 8,
    lightweight: true,
  });

  return (
    <CollectionSection
      title={sec.title}
      products={products}
      href={`/collections/${sec.handle}`}
      totalCount={products.length}
      showNewBadge={sec.showNewBadge}
      hideViewAll={sec.hideViewAll}
      showViewAll={!sec.hideViewAll}
      viewAllRed={sec.viewAllRed}
    />
  );
}

async function AsyncMediaGrid() {
  const settings = await getSettings();
  return <MediaGrid videoSrc={settings.campaignVideoUrl} />;
}

export default function HomePage() {
  return (
    <>
      <HeroSlider slides={HERO_SLIDES} />

      {/* Progressive Streaming: Each section streams in independently as soon as its 8 lightweight items resolve */}
      {HOMEPAGE_SECTIONS.map((sec) => (
        <Suspense
          key={sec.handle}
          fallback={<CollectionSectionSkeleton title={sec.title} count={8} />}
        >
          <AsyncCollectionSection sec={sec} />
        </Suspense>
      ))}

      <Suspense fallback={<MediaGridSkeleton />}>
        <AsyncMediaGrid />
      </Suspense>

      <EventSection />
      <InstagramFeed />
      <NewsletterSection />
    </>
  );
}
