import Image from "next/image";
import Link from "next/link";
import { EVENTS } from "@/data/campaigns";

export default function EventSection() {
  return (
    <section className="mx-auto w-full max-w-[1420px] px-2.5 py-8 md:px-10 md:py-12">
      <h2 className="heading mb-8 text-center text-[25px] md:mb-10">SHOP BY EVENT</h2>
      <div className="grid grid-cols-2 gap-[10px] md:grid-cols-5 md:gap-[17px]">
        {EVENTS.map((e, i) => (
          <Link key={e.label} href={e.href} className={`group relative block overflow-hidden ${i === 4 ? "col-span-2 mx-auto w-1/2 md:col-span-1 md:w-full" : ""}`}>
            <div className="relative aspect-[2/3] w-full">
              <Image src={e.image} alt={e.alt} fill sizes="(min-width: 768px) 20vw, 50vw" className="object-cover transition-transform duration-700 motion-reduce:transition-none md:group-hover:scale-105" />
            </div>
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-5 py-2 text-[13px] uppercase tracking-[0.1em] whitespace-nowrap shadow-md transition-colors group-hover:bg-neutral-800">
              {e.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
