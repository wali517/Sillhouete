import { Award, Camera, MessageCircle, RotateCcw } from "lucide-react";

export default function KeyActives() {
  const blocks = [
    {
      title: "Design & Product",
      desc: "Carefully curated & handcrafted by master artisans in Lahore.",
      icon: Award,
    },
    {
      title: "Photoshoots & Cataloging",
      desc: "True to color and true to reality pictures of each garment.",
      icon: Camera,
    },
    {
      title: "Client Consultation & Support",
      desc: "Dedicated styling and custom sizing advice via WhatsApp.",
      icon: MessageCircle,
    },
    {
      title: "Easy Returns",
      desc: "Guaranteed authentic designer wear & customer satisfaction.",
      icon: RotateCcw,
    },
  ];

  return (
    <section className="my-16 border-t border-b border-black/10 py-12 bg-[#faf9f8]">
      <div className="mx-auto max-w-[1300px] px-4">
        <h2 className="heading text-center text-[22px] md:text-[26px] uppercase tracking-[0.2em] text-[#111111] mb-10">
          Key Actives
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {blocks.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="flex flex-col items-center px-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-white border border-black/10 shadow-sm mb-4 text-black">
                  <Icon className="h-6 w-6 stroke-[1.5]" />
                </div>
                <h3 className="heading text-sm md:text-base uppercase tracking-wider mb-2 text-black">
                  {b.title}
                </h3>
                <p className="text-xs text-black/60 leading-relaxed max-w-[220px]">
                  {b.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
