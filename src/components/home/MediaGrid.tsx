
import Image from "next/image";
import { MEDIA_IMAGE, VIDEO_URL } from "@/data/campaigns";

export default function MediaGrid() {
  const video = (
    <video
      className="absolute inset-0 h-full w-full object-cover"
      playsInline
      autoPlay
      muted
      loop
      preload="metadata"
      aria-label="Sillhouete campaign film"
    >
      <source src={VIDEO_URL} type="video/mp4" />
    </video>
  );

  return (
    <section aria-label="Campaign film" className="w-full bg-black overflow-hidden">
      {/* Mobile & Tablet: Swipeable horizontal scroll */}
      <div className="md:hidden flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar touch-pan-x">
        <div className="relative w-[85vw] shrink-0 aspect-[9/16] snap-center overflow-hidden">
          {video}
        </div>
        <div className="relative w-[85vw] shrink-0 aspect-[9/16] snap-center overflow-hidden">
          <Image
            src={MEDIA_IMAGE}
            alt="Blush pink bridal lehenga with heavy silver embroidery"
            fill
            sizes="85vw"
            className="object-cover"
          />
        </div>
        <div className="relative w-[85vw] shrink-0 aspect-[9/16] snap-center overflow-hidden">
          {video}
        </div>
      </div>

      {/* Desktop: 3-column Grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-0 min-h-[560px]">
        <div className="relative w-full h-full min-h-[560px] overflow-hidden">
          {video}
        </div>
        <div className="relative w-full h-full min-h-[560px] overflow-hidden">
          <Image
            src={MEDIA_IMAGE}
            alt="Blush pink bridal lehenga with heavy silver embroidery"
            fill
            sizes="33vw"
            className="object-cover"
          />
        </div>
        <div className="relative w-full h-full min-h-[560px] overflow-hidden">
          {video}
        </div>
      </div>
    </section>
  );
}
