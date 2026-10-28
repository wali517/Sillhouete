
import HeroSlider from "@/components/home/HeroSlider";
import CollectionSection from "@/components/home/CollectionSection";
import MediaGrid from "@/components/home/MediaGrid";
import EventSection from "@/components/home/EventSection";
import InstagramFeed from "@/components/home/InstagramFeed";
import NewsletterSection from "@/components/home/NewsletterSection";

import { HERO_SLIDES } from "@/data/campaigns";
import {
  bestSellers,
  formals,
  maahiII,
  rahaPret,
  silkSolids,
} from "@/data/products";

export default function HomePage() {
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
        totalCount={8}
        showViewAll
      />

      <CollectionSection
        title="Best Sellers"
        products={bestSellers}
        href="/collections/best-sellers"
        totalCount={17}
      />

      <CollectionSection
        title="Formals"
        products={formals}
        href="/collections/formal-dresses"
        totalCount={67}
      />

      <MediaGrid />
      <EventSection />
      <InstagramFeed />
      <NewsletterSection />
    </>
  );
}
