import { notFound } from "next/navigation";
import Link from "next/link";
import { getSettings } from "@/lib/db";
import livePagesData from "@/data/live-pages-content.json";
import { ContactInquiryForm } from "@/components/ui/ContactInquiryForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const livePages = livePagesData as Record<string, { title: string; html: string }>;

type Props = { params: Promise<{ slug: string }> };

const SLUGS = [
  "locations",
  "policies",
  "brand-story",
  "terms-and-conditions",
  "size-chart",
  "shipping-policy",
  "contact-us",
  "privacy-policy",
  "faqs",
  "spot",
  "spotted",
  "shipping-returns-exchange-refund-policy",
];

const SPOTTED_ITEMS = [
  {
    name: "Rida Khawar",
    handle: "nargis-rb-06",
    image: "https://sillhouete.com/cdn/shop/files/Untitled-1_0012_IMG-20251015-WA0040.jpg?v=1760528497&width=600",
    alt: "Rida Khawar",
  },
  {
    name: "Momina Iqbal",
    handle: "orange",
    image: "https://sillhouete.com/cdn/shop/files/Don_t_lose_that_sparkle_that_makes_you___Styling__daniiyah05__Makeup__haseebkhan_4540__Dress__sillhouete.official__Jewellery__ayeshaccessories__7_46f0fbb8-adaf-47f6-91e3-b9cee95ef639.jpg?v=1758789708&width=600",
    alt: "Momina Iqbal",
  },
  {
    name: "Hina Niazi",
    handle: "slx-5",
    image: "https://sillhouete.com/cdn/shop/files/WhatsApp_Image_2025-04-22_at_15.16.00_d01f29aa.webp?v=1758789816&width=600",
    alt: "Hina Niazi",
  },
  {
    name: "Abeera Riaz",
    handle: "grey",
    image: "https://sillhouete.com/cdn/shop/files/web_images_0000_2.jpg?v=1758812672&width=600",
    alt: "Abeera Riaz",
  },
  {
    name: "Sophia ch",
    handle: "slx-5",
    image: "https://sillhouete.com/cdn/shop/files/1_af93ee57-224a-4ebb-af63-11eaaa371e90.jpg?v=1759820897&width=600",
    alt: "Sophia ch",
  },
  {
    name: "Sophia ch",
    handle: "orange",
    image: "https://sillhouete.com/cdn/shop/files/WhatsApp_Image_2025-03-24_at_10.55.48_9d6827e0.webp?v=1758789837&width=600",
    alt: "Sophia ch",
  },
  {
    name: "Fiza Ali",
    handle: "noor-jahan-d-8",
    image: "https://sillhouete.com/cdn/shop/files/IMG_5194.webp?v=1758789837&width=600",
    alt: "Fiza Ali",
  },
  {
    name: "Fiza Ali",
    handle: "jacket-1-sj-3",
    image: "https://sillhouete.com/cdn/shop/files/WhatsApp_Image_2025-03-14_at_14.09.28_7eb91c72.webp?v=1758789817&width=600",
    alt: "Fiza Ali",
  },
];

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const titles: Record<string, string> = {
    locations: "Store Locations – Flagship Studios & Stockists",
    "privacy-policy": "Privacy Policy",
    policies: "Made-to-Order, Exchange & Refund Policy",
    "terms-and-conditions": "Terms and Conditions",
    "size-chart": "Size Chart & Measurement Guide",
    "brand-story": "Brand Story – Luxury Pret Fashion Heritage",
    "shipping-policy": "Shipping Policy – Delivery & Worldwide Shipping",
    "contact-us": "Contact Us – Customer Support & Studio Inquiries",
    faqs: "Frequently Asked Questions (FAQs)",
    spot: "check out the celebrities`s spotts in the dresses – Sillhouete",
    spotted: "check out the celebrities`s spotts in the dresses – Sillhouete",
    "shipping-returns-exchange-refund-policy":
      "Shipping, Returns, Exchange & Refund Policy",
  };
  return { title: `${titles[slug] || "Information"} – Sillhouete` };
}

export default async function InfoPage({ params }: Props) {
  const { slug } = await params;
  const settings = await getSettings();

  if (!SLUGS.includes(slug)) {
    notFound();
  }

  const normalizedSlug = slug === "spotted" ? "spot" : slug;
  const liveData = livePages[normalizedSlug];

  return (
    <article
      className={`mx-auto w-full ${
        normalizedSlug === "spot" ? "max-w-[1240px]" : "max-w-[1050px]"
      } px-4 py-8 md:px-8 md:py-14`}
    >
      {/* 3. Spotted Page */}
      {(normalizedSlug === "spot") && (
        <div className="spotted-section">
          <h2 className="spotted-title">Spotted</h2>

          <div className="spotted-grid">
            {SPOTTED_ITEMS.map((item, idx) => (
              <div key={idx} className="spotted-item">
                <Link href={`/products/${item.handle}`} className="spotted-image-link">
                  <img
                    src={item.image}
                    alt={item.alt}
                    loading={idx < 4 ? "eager" : "lazy"}
                  />
                </Link>
                <div className="spotted-content">
                  <h3>{item.name}</h3>
                  <Link href={`/products/${item.handle}`} className="shop-now-btn">
                    Shop Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Locations Page */}
      {slug === "locations" && (
        <div className="space-y-8">
          <header className="text-center border-b border-line pb-8">
            <h1 className="heading text-[30px] md:text-[38px]">Our Locations</h1>
            <p className="mt-2 text-xs text-black/60 uppercase tracking-widest">
              Flagship Studio, Retail Outlets &amp; Stockists
            </p>
          </header>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <div className="border border-line p-6 bg-soft space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9b8065]">Flagship Studio</span>
                <h2 className="heading text-[18px]">Lahore Flagship Studio</h2>
                <p className="text-sm text-black/80">
                  📍 {settings.studioAddress || settings.officeAddress || "327 B, Street 7, Cavalry Ground, Lahore, Pakistan."}
                </p>
                <p className="text-xs text-black/60 pt-2">
                  For appointments &amp; bespoke consultations: <a href={`tel:${(settings.phone || "+92 331 0397865").replace(/\s+/g, "")}`} className="underline font-semibold">{settings.phone || "+92 331 0397865"}</a>
                </p>
              </div>

              <div className="border border-line p-6 space-y-4 text-sm">
                <h3 className="heading text-[15px] border-b border-line pb-2">Authorized Stockists</h3>
                
                <div>
                  <strong className="block text-black">LAHORE – PFDC</strong>
                  <p className="text-black/75">Mall-1, 94-D/1, Main Boulevard, Block D-1 Gulberg III, Lahore.</p>
                </div>

                <div>
                  <strong className="block text-black">LAHORE – FPL</strong>
                  <p className="text-black/75">165-P College Road, Block P, Gulberg II, Lahore. 📞 042-35762884</p>
                </div>

                <div>
                  <strong className="block text-black">KARACHI – FPL</strong>
                  <p className="text-black/75">Mezzanine Floor, Inside Allure Beauty, next to LAMA &amp; Walkeaze, Dolmen Mall Clifton. 📞 021-35293967</p>
                </div>

                <div>
                  <strong className="block text-black">RAWALPINDI – FPL</strong>
                  <p className="text-black/75">30-A Giga Mall Rawalpindi. 📞 051-2725624</p>
                </div>

                <div>
                  <strong className="block text-black">MULTAN – FPL</strong>
                  <p className="text-black/75">94-A, Gulgasht Colony, Pizza Hut Road, Opposite Punjab College, Multan. 📞 061-6510386-7</p>
                </div>
              </div>
            </div>

            <div className="border border-line overflow-hidden bg-soft flex flex-col items-center justify-center min-h-[350px]">
              <iframe
                loading="lazy"
                title="Sillhouete Lahore Studio Map"
                style={{ border: 0, width: "100%", height: "100%", minHeight: "420px" }}
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d29946.235449935975!2d74.34133967848776!3d31.50564512196947!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391905c9f519fe6d%3A0x52e02dc912ab5e8c!2s327b%20Street%207%2C%20Cavalry%20Ground%2C%20Lahore%2C%20Punjab%2C%20Pakistan!5e0!3m2!1sen!2s!4v1722237002682!5m2!1sen!2s"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. Contact Us Page */}
      {slug === "contact-us" && (
        <div className="space-y-10">
          <header className="text-center border-b border-line pb-8">
            <h1 className="heading text-[30px] md:text-[38px]">Contact Us</h1>
            <p className="mt-2 text-xs text-black/60 uppercase tracking-widest">
              Customer Support, Bridal Consultations &amp; Studio Inquiries
            </p>
          </header>

          <div className="grid gap-10 lg:grid-cols-12 items-start">
            {/* Left Column: Direct Info & Addresses */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 bg-soft space-y-4 text-sm rounded-lg">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9b8065] block">
                  Studio &amp; Head Office
                </span>

                <div>
                  <h4 className="font-semibold text-black text-xs uppercase tracking-wider">Pakistan Office</h4>
                  <p className="text-xs text-black/75 mt-0.5">
                    {settings.officeAddress || "327-B, Street 7, Lane 15, Cavalry Ground, Lahore, Pakistan."}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-black text-xs uppercase tracking-wider">Studio Address</h4>
                  <p className="text-xs text-black/75 mt-0.5">
                    {settings.studioAddress || "Sillhouete, Almas Tower, MM Alam Rd, Block T, Gulberg 2, Lahore."}
                  </p>
                </div>

                <div className="pt-2 border-t border-line">
                  <h4 className="font-semibold text-black text-xs uppercase tracking-wider">USA Office</h4>
                  <p className="text-xs text-black/75 mt-0.5">
                    18w100 22nd St, Ste 124, Oakbrook Terrace, IL, Zip Code 60181
                  </p>
                  <p className="text-xs text-black/60 mt-1">Phone: +1 217 2909383</p>
                </div>

                <div className="pt-3 border-t border-line space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-black block">Direct Channels</span>
                  <p className="text-xs flex items-center gap-2">
                    <span>📞 Phone:</span>
                    <a href={`tel:${(settings.phone || "+923310397865").replace(/\s+/g, "")}`} className="underline font-medium">
                      {settings.phone || "+92 331 0397865"}
                    </a>
                  </p>
                  <p className="text-xs flex items-center gap-2">
                    <span>💬 WhatsApp:</span>
                    <a
                      href={`https://wa.me/${(settings.phone || "923310397865").replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium text-emerald-800"
                    >
                      Chat on WhatsApp
                    </a>
                  </p>
                  <p className="text-xs flex items-center gap-2">
                    <span>📧 Email:</span>
                    <a href={`mailto:${settings.email || "info@sillhouete.com"}`} className="underline font-medium">
                      {settings.email || "info@sillhouete.com"}
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Inquiry Form */}
            <div className="lg:col-span-7">
              <ContactInquiryForm />
            </div>
          </div>
        </div>
      )}

      {/* 6. Size Chart Page */}
      {slug === "size-chart" && (
        <div className="space-y-8">
          <header className="text-center border-b border-line pb-8">
            <h1 className="heading text-[30px] md:text-[38px]">Size Chart</h1>
            <p className="mt-2 text-xs text-black/60 uppercase tracking-widest">
              Standard Measurements in Inches &amp; Custom Sizing Guidelines
            </p>
          </header>

          {liveData?.html ? (
            <div
              className="page-rte overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: liveData.html }}
            />
          ) : null}
        </div>
      )}

      {/* 7. Comprehensive Policies and Other Information Pages */}
      {normalizedSlug !== "spot" && normalizedSlug !== "locations" && normalizedSlug !== "size-chart" && normalizedSlug !== "contact-us" && (
        <div className="space-y-8">
          <header className="text-center border-b border-line pb-8">
            <h1 className="heading text-[30px] md:text-[38px]">
              {liveData?.title || slug.replace(/-/g, " ")}
            </h1>
          </header>

          {liveData?.html ? (
            <div
              className="page-rte leading-[1.7] text-[#222222]"
              dangerouslySetInnerHTML={{ __html: liveData.html }}
            />
          ) : (
            <p className="text-center text-sm text-black/70">
              Information for this page is being updated.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
