import {
  HeroSkeleton,
  CollectionSectionSkeleton,
  MediaGridSkeleton,
} from "@/components/ui/Skeletons";

export default function HomeLoading() {
  return (
    <>
      <HeroSkeleton />
      <CollectionSectionSkeleton title="MAAHI II LUXURY EID PRET" count={8} />
      <CollectionSectionSkeleton title="Silk Solids'26" count={8} />
      <CollectionSectionSkeleton title="Raha Eid Pret'26" count={8} />
      <MediaGridSkeleton />
    </>
  );
}

