import Image from "next/image";
import { MEDIA_IMAGE, VIDEO_URL } from "@/data/campaigns";
export default function MediaGrid() {
  const video = (
    <video
      className="h-full w-full object-cover"
      playsInline
      autoPlay
      muted
      loop
      controls
      aria-label="Sillhouete campaign film"
    >
      <source src={VIDEO_URL} type="video/mp4" />
    </video>
  );

  return (
    <section aria-label="Campaign film" className="grid grid-cols-1 md:grid-cols-3 bg-black">
      <div className="relative aspect-[9/16] md:aspect-auto overflow-hidden min-h-[380px] md:min-h-[560px]">
        {video}
      </div>
      <div className="relative min-h-[380px] md:min-h-[560px] overflow-hidden">
        <Image
          src={MEDIA_IMAGE}
          alt="Blush pink bridal lehenga with heavy silver embroidery"
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="hidden md:block relative overflow-hidden min-h-[560px]">
        {video}
      </div>
    </section>
  );
}
