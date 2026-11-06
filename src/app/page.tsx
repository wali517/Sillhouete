import HeroSlider from "@/components/home/HeroSlider";
import MainCategoryShowcase from "@/components/home/MainCategoryShowcase";
import CollectionSection from "@/components/home/CollectionSection";
import MediaGrid from "@/components/home/MediaGrid";
import EventSection from "@/components/home/EventSection";
import InstagramFeed from "@/components/home/InstagramFeed";
import NewsletterSection from "@/components/home/NewsletterSection";
import { HERO_SLIDES } from "@/data/campaigns";
import { getProductsByCollection, getMainCategories } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  // 1. Dynamically fetch active Main Categories from MongoDB Atlas
  const activeMainCategories = await getMainCategories(true);

  // 2. Fetch products for each active main category concurrently
  const sections = await Promise.all(
    activeMainCategories.map(async (cat) => {
      const products = await getProductsByCollection(cat.handle);
      return {
        cat,
        products,
      };
    })
  );

  // Filter sections that have products for the horizontal sliders
  const activeProductSections = sections.filter((s) => s.products && s.products.length > 0);

  return (
    <>
      <HeroSlider slides={HERO_SLIDES} />

      {/* Dynamic Main Category Showcase Grid: All Active Main Categories from MongoDB appear here */}
      <MainCategoryShowcase categories={activeMainCategories} />

      {/* Dynamic Product Collection Carousels for Main Categories with Products */}
      {activeProductSections.map(({ cat, products }) => {
        const isHideViewAll =
          cat.handle === "maahi-ii-luxury-eid-pret" || cat.handle === "silk-solids26";
        const isRedViewAll = cat.handle === "raha-eid-pret26";
        const isNewBadge =
          cat.handle === "maahi-ii-luxury-eid-pret" || cat.handle === "silk-solids26";

        return (
          <CollectionSection
            key={cat.handle}
            title={cat.title}
            products={products}
            href={`/collections/${cat.handle}`}
            totalCount={products.length}
            showNewBadge={isNewBadge}
            hideViewAll={isHideViewAll}
            showViewAll={!isHideViewAll}
            viewAllRed={isRedViewAll}
          />
        );
      })}

      <MediaGrid />
      <EventSection />
      <InstagramFeed />
      <NewsletterSection />
    </>
  );
}
