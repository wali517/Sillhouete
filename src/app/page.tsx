
import HeroSlider from "@/components/home/HeroSlider";
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
  // 1. Fetch main categories from MongoDB
  let mainCats = await getMainCategories();

  const defaultHandles = [
    { handle: "maahi-ii-luxury-eid-pret", title: "MAAHI II LUXURY EID PRET" },
    { handle: "silk-solids26", title: "Silk Solids'26" },
    { handle: "raha-eid-pret26", title: "Raha Eid Pret'26" },
    { handle: "best-sellers", title: "Best Sellers" },
    { handle: "formal-dresses", title: "Formals" },
  ];

  if (!mainCats || mainCats.length === 0) {
    mainCats = defaultHandles.map((d) => ({
      handle: d.handle,
      title: d.title,
      isMainCategory: true,
      showOnHomepage: true,
    }));
  } else {
    const existingHandles = new Set(mainCats.map((c) => c.handle));
    for (const def of defaultHandles) {
      if (!existingHandles.has(def.handle)) {
        mainCats.push({
          handle: def.handle,
          title: def.title,
          isMainCategory: true,
          showOnHomepage: true,
        });
      }
    }
  }

  // 2. Fetch products for each main category concurrently
  const sections = await Promise.all(
    mainCats.map(async (cat) => {
      const products = await getProductsByCollection(cat.handle);
      return {
        cat,
        products,
      };
    })
  );

  // Render categories that have products
  const activeSections = sections.filter((s) => s.products && s.products.length > 0);

  return (
    <>
      <HeroSlider slides={HERO_SLIDES} />

      {activeSections.map(({ cat, products }) => {
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
