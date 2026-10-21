import { notFound } from "next/navigation";
import { FOOTER_LINKS } from "@/data/site";
import ContactFormSection from "./ContactFormSection";
import FaqAccordion from "./FaqAccordion";
import { allProducts } from "@/data/products";
import ProductCard from "@/components/products/ProductCard";

type Props = { params: Promise<{ slug: string }> };

const SLUGS = [
  "privacy-policy",
  "policies",
  "terms-and-conditions",
  "brand-story",
  "shipping-policy",
  "contact-us",
  "faqs",
  "spot",
];

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const titles: Record<string, string> = {
    "privacy-policy": "Privacy Policy",
    policies: "Made-to-Order, Exchange & Refund Policy",
    "terms-and-conditions": "Terms and Conditions",
    "brand-story": "Brand Story – Luxury Pret Fashion Heritage",
    "shipping-policy": "Shipping Policy – Delivery & Worldwide Shipping",
    "contact-us": "Contact Us – Customer Support & Studio Inquiries",
    faqs: "Frequently Asked Questions (FAQs)",
    spot: "Spotted – Celebrities in Sillhouete",
  };
  return { title: `${titles[slug] || "Information"} – Sillhouete` };
}

export default async function InfoPage({ params }: Props) {
  const { slug } = await params;

  if (!SLUGS.includes(slug)) {
    notFound();
  }

  return (
    <article className="mx-auto w-full max-w-[1000px] px-5 py-12 md:py-16">
      {slug === "contact-us" && (
        <div>
          <h1 className="heading mb-3 text-center text-[28px] md:text-[36px]">Contact Us</h1>
          <p className="mx-auto max-w-xl text-center text-sm text-black/70 mb-10">
            Reach out to Sillhouete for styling advice, bespoke bridal appointments, order status, or wholesale inquiries.
          </p>

          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
            {/* Contact Information Cards */}
            <div className="space-y-6 text-sm">
              <div className="border border-line p-6 bg-soft space-y-3">
                <h2 className="heading text-[16px]">Pakistan (Office &amp; Studio)</h2>
                <div>
                  <strong className="block text-black">Office Address:</strong>
                  <p className="text-black/70">327-B, Street 7, Lane 15, Cavalry Ground, Lahore</p>
                </div>
                <div>
                  <strong className="block text-black">Studio Address:</strong>
                  <p className="text-black/70">Sillhouete, Almas Tower, MM Alam Rd, Block T, Gulberg 2, Lahore</p>
                </div>
                <div>
                  <strong className="block text-black">WhatsApp / Bookings:</strong>
                  <p className="text-black/70">
                    <a href="tel:+923310397865" className="underline hover:text-black">+92 331 0397865</a> /{" "}
                    <a href="tel:+923154204981" className="underline hover:text-black">+92 315 4204981</a>
                  </p>
                </div>
                <div>
                  <strong className="block text-black">Email:</strong>
                  <p className="text-black/70">
                    <a href="mailto:info@sillhouete.com" className="underline hover:text-black">info@sillhouete.com</a>
                  </p>
                </div>
              </div>

              <div className="border border-line p-6 bg-soft space-y-3">
                <h2 className="heading text-[16px]">USA Office</h2>
                <p className="text-black font-semibold">ADVENT BUSINESS CONSULTAX LLC</p>
                <p className="text-black/70">18w100 22nd St, Ste 124, Oakbrook Terrace, IL, Zip Code 60181</p>
                <div>
                  <strong className="block text-black">Phone:</strong>
                  <p className="text-black/70">
                    <a href="tel:+12172909383" className="underline hover:text-black">+1 217 2909383</a>
                  </p>
                </div>
                <div>
                  <strong className="block text-black">Operating Hours:</strong>
                  <p className="text-black/70">Monday – Sunday: 10:00 AM – 8:00 PM (PKT)</p>
                </div>
              </div>
            </div>

            {/* Interactive Contact Form */}
            <div className="border border-line p-6 md:p-8">
              <h2 className="heading text-[18px] mb-2">Send Us a Message</h2>
              <p className="text-xs text-black/60 mb-6">
                Fill in the form below and our studio concierge will respond within 24 hours.
              </p>
              <ContactFormSection />
            </div>
          </div>
        </div>
      )}

      {slug === "brand-story" && (
        <div className="space-y-8 text-[15px] leading-relaxed text-black/85">
          <header className="text-center border-b border-line pb-8">
            <p className="text-xs uppercase tracking-widest text-black/60">Our Heritage &amp; Craft</p>
            <h1 className="heading mt-2 text-[30px] md:text-[40px]">Brand Story</h1>
          </header>

          <div className="mx-auto max-w-2xl space-y-6">
            <div className="bg-soft p-6 border-l-2 border-black italic text-black/90">
              &ldquo;SILLHOUETE was born out of a passion for preserving the rich heritage of Pakistani bridal wear while catering to the evolving needs of modern women.&rdquo;
            </div>

            <section className="space-y-3">
              <h2 className="heading text-[20px] text-black">Understanding The Brand</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Niche:</strong> Bridal wear, high formal, formal, luxury pret, and festive occasion wear.</li>
                <li><strong>Target Audience:</strong> Modern women, discerning brides, and families seeking refined elegance.</li>
                <li><strong>Brand Values:</strong> Exquisite craftsmanship, authentic Pakistani heritage, contemporary cuts, and unmatched convenience.</li>
                <li><strong>Unique Selling Proposition (USP):</strong> Affordable, modern cuts and ready-to-wear bridal dresses delivered globally on short notices for busy brides.</li>
                <li><strong>Brand Personality:</strong> Luxury, elegance, and tradition with an innovative modern twist.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="heading text-[20px] text-black">The Storyline</h2>
              <p>
                Founded in 2005, SILLHOUETE has become synonymous with exquisite craftsmanship, luxurious fabrics, and innovative designs. Each creation represents an ode to timeless South Asian couture, revitalized for contemporary women worldwide.
              </p>
              <p>
                In a world where time is often of the essence, our commitment to providing ready-to-wear bridal and luxury formal dresses has revolutionized the industry. By offering a diverse range of silhouettes—from traditional Angrakhas and peshwas to sleek modern tunics—SILLHOUETE empowers women to discover their dream look without compromising on quality or schedule.
              </p>
              <p>
                Each SILLHOUETE creation is a testament to our dedication to excellence. From intricate handmade Ada work and costly zardozi threadwork to flawless master tailoring, every detail is meticulously handcrafted in our Lahore studio to ensure the wearer feels regal, confident, and unforgettable.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="heading text-[20px] text-black">Our Core Pillars</h2>
              <div className="grid gap-4 sm:grid-cols-3 pt-2 text-xs">
                <div className="border border-line p-4 bg-soft">
                  <strong className="block text-sm mb-1 text-black">Heritage &amp; Innovation</strong>
                  Seamlessly blending centuries-old Pakistani aesthetics with modern cuts and comfortable fabrics.
                </div>
                <div className="border border-line p-4 bg-soft">
                  <strong className="block text-sm mb-1 text-black">Convenience &amp; Quality</strong>
                  Ready-to-wear bridal dresses available with rapid worldwide delivery to save busy brides valuable time.
                </div>
                <div className="border border-line p-4 bg-soft">
                  <strong className="block text-sm mb-1 text-black">Empowerment &amp; Poise</strong>
                  Crafting ensembles that allow women to celebrate their most sacred moments with effortless confidence.
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {slug === "shipping-policy" && (
        <div className="space-y-8 text-[15px] leading-relaxed text-black/85">
          <header className="text-center border-b border-line pb-8">
            <h1 className="heading text-[30px] md:text-[38px]">Shipping Policy</h1>
            <p className="mt-2 text-xs text-black/60 uppercase tracking-widest">
              Worldwide Delivery &amp; Transit Timelines
            </p>
          </header>

          <div className="mx-auto max-w-2xl space-y-6 text-sm">
            <p>
              We are committed to ensuring a seamless shopping experience for all our patrons across Pakistan and around the world. Below are the details of our shipping policies:
            </p>

            <div className="border border-line p-5 bg-soft space-y-2">
              <h2 className="heading text-[16px]">Processing Time</h2>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>Ready-to-wear orders:</strong> Processed and dispatched within 1–3 business days (excluding weekends and official holidays).</li>
                <li><strong>Custom or Made-to-Order items:</strong> Require bespoke production time (typically 2–4 weeks for formals and 4–8 weeks for bridals), as conveyed by our concierge team upon booking.</li>
              </ul>
            </div>

            <div className="border border-line p-5 bg-soft space-y-2">
              <h2 className="heading text-[16px]">Shipping Options &amp; Delivery Timelines</h2>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>Domestic Shipping (Pakistan):</strong> Delivery within 3–5 business days via trusted couriers (TCS / Call Courier). Standard flat rate of Rs. 250 (Free for orders Rs. 140,000+).</li>
                <li><strong>International Shipping:</strong> Delivery within 7–14 business days depending on destination via DHL Express or FedEx. Tracking is provided upon dispatch.</li>
              </ul>
            </div>

            <div className="border border-line p-5 bg-soft space-y-2">
              <h2 className="heading text-[16px]">Tracking &amp; Customs Duties</h2>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Once your order ships, an active tracking number is sent to your registered email and WhatsApp.</li>
                <li>For international shipments, customs duties or local taxes (if applicable) are determined by destination country authorities and remain the responsibility of the recipient.</li>
                <li>Please ensure your shipping address and contact telephone are accurate to prevent delivery delays.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {slug === "policies" && (
        <div className="space-y-8 text-[15px] leading-relaxed text-black/85">
          <header className="text-center border-b border-line pb-8">
            <h1 className="heading text-[30px] md:text-[38px]">Policies</h1>
            <p className="mt-2 text-xs text-black/60 uppercase tracking-widest">
              Made-to-Order, Exchange, Refund &amp; Cancellation Terms
            </p>
          </header>

          <div className="mx-auto max-w-2xl space-y-6 text-sm">
            <section className="border border-line p-6 bg-soft space-y-3">
              <h2 className="heading text-[17px]">Order Cancellation &amp; Refund Policy</h2>
              <p className="text-xs">
                <strong>For Made-to-Order Purchases:</strong> You can cancel your order within 24 hours of purchase without deduction, and your amount will be refunded to your given bank account. After 24 hours, raw materials and artisanal work are allocated, so paid advance deposits are non-refundable.
              </p>
              <p className="text-xs">
                <strong>For Ready-to-Wear Purchases:</strong> Orders can be cancelled within 24 hours of purchase subject to a 10% administrative processing fee. The remainder will be credited back to your original payment method. After 24 hours, orders cannot be cancelled once processed for dispatch.
              </p>
              <p className="text-xs">
                To cancel, contact customer care via email at <strong>info@sillhouete.com</strong> or WhatsApp at <strong>+92 331 0397865</strong>.
              </p>
            </section>

            <section className="border border-line p-6 bg-soft space-y-3">
              <h2 className="heading text-[17px]">Exchanges Policy</h2>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Products cannot be exchanged at our physical retail locations.</li>
                <li>We offer exchanges strictly if the article delivered is faulty, damaged in transit, or different from the ordered specifications.</li>
                <li>Discounted and sale items are final sale and non-exchangeable unless incorrect goods were delivered.</li>
                <li>To initiate an exchange, provide your order number and photographs within 48 hours of receiving the parcel.</li>
              </ul>
            </section>

            <section className="border border-line p-6 bg-soft space-y-3">
              <h2 className="heading text-[17px]">Made-to-Order Terms</h2>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>A 50% advance deposit is required to process bespoke formal wear, and 100% full payment for ready-to-wear articles.</li>
                <li>No design, color, or measurement modifications can be accommodated after 24 hours of placing the order.</li>
                <li>Full payment settlement is required prior to parcel dispatch from our Lahore facility.</li>
              </ul>
            </section>
          </div>
        </div>
      )}

      {slug === "terms-and-conditions" && (
        <div className="space-y-8 text-[15px] leading-relaxed text-black/85">
          <header className="text-center border-b border-line pb-8">
            <h1 className="heading text-[30px] md:text-[38px]">Terms &amp; Conditions</h1>
            <p className="mt-2 text-xs text-black/60 uppercase tracking-widest">
              Website Usage, Pricing &amp; Service Agreement
            </p>
          </header>

          <div className="mx-auto max-w-2xl space-y-6 text-sm">
            <section className="space-y-2">
              <h2 className="heading text-[16px]">1. General Overview</h2>
              <p className="text-xs text-black/80">
                This website is operated by Sillhouete. Throughout the site, the terms &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; refer to Sillhouete. By visiting our site or purchasing from us, you engage in our &ldquo;Service&rdquo; and agree to be bound by the following terms and conditions.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="heading text-[16px]">2. Accuracy of Product Colors &amp; Craftsmanship</h2>
              <p className="text-xs text-black/80">
                We make every effort to display the colors, textures, and embroidery details of our apparel as accurately as possible. However, because computer monitors and mobile displays vary, slight tonal nuances may occur. Each handcrafted outfit features hand-embroidery (Ada work) which naturally exhibits unique artisanal charm.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="heading text-[16px]">3. Pricing &amp; Currency</h2>
              <p className="text-xs text-black/80">
                Prices for our products are subject to change without notice. All transactions are billed in PKR or converted dynamically according to standard daily bank exchange rates. We reserve the right at any time to modify or discontinue any product line.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="heading text-[16px]">4. Intellectual Property</h2>
              <p className="text-xs text-black/80">
                All designs, logos, images, graphics, and textual content on this website are the intellectual property of Sillhouete. Unauthorized duplication, re-sale, or reproduction is strictly prohibited.
              </p>
            </section>
          </div>
        </div>
      )}

      {slug === "privacy-policy" && (
        <div className="space-y-8 text-[15px] leading-relaxed text-black/85">
          <header className="text-center border-b border-line pb-8">
            <h1 className="heading text-[30px] md:text-[38px]">Privacy Policy</h1>
            <p className="mt-2 text-xs text-black/60 uppercase tracking-widest">
              Data Protection &amp; Customer Privacy
            </p>
          </header>

          <div className="mx-auto max-w-2xl space-y-6 text-sm">
            <p>
              At Sillhouete, we take the confidentiality of your personal data with the utmost responsibility. This Privacy Policy details how your personal information is gathered, utilized, and safeguarded.
            </p>

            <section className="border border-line p-5 bg-soft space-y-2">
              <h2 className="heading text-[16px]">Information We Collect</h2>
              <p className="text-xs text-black/80">
                When you make a purchase or create an account, we collect necessary information including your name, billing address, shipping address, payment information (encrypted via Stripe), email address, and phone number.
              </p>
            </section>

            <section className="border border-line p-5 bg-soft space-y-2">
              <h2 className="heading text-[16px]">How We Use Your Personal Data</h2>
              <ul className="list-disc pl-5 space-y-1 text-xs text-black/80">
                <li>To fulfill orders, process payments, and coordinate delivery with couriers.</li>
                <li>To communicate with you regarding order milestones, tracking, and inquiries.</li>
                <li>To detect and prevent fraudulent transactions.</li>
                <li>With your consent, to provide curated announcements and festive collection previews.</li>
              </ul>
            </section>

            <section className="border border-line p-5 bg-soft space-y-2">
              <h2 className="heading text-[16px]">Payment Security</h2>
              <p className="text-xs text-black/80">
                All credit and debit card payments are handled securely through PCI-DSS compliant direct payment gateways (Stripe). Your card credentials are never stored on our servers.
              </p>
            </section>
          </div>
        </div>
      )}

      {slug === "faqs" && (
        <div>
          <header className="text-center border-b border-line pb-8 mb-8">
            <h1 className="heading text-[30px] md:text-[38px]">Frequently Asked Questions</h1>
            <p className="mt-2 text-xs text-black/60 uppercase tracking-widest">
              Everything You Need to Know About Ordering, Delivery &amp; Sizing
            </p>
          </header>
          <div className="mx-auto max-w-2xl">
            <FaqAccordion />
          </div>
        </div>
      )}

      {slug === "spot" && (
        <div className="space-y-10">
          <header className="text-center border-b border-line pb-8">
            <h1 className="heading text-[30px] md:text-[40px]">Spotted In Sillhouete</h1>
            <p className="mt-2 text-xs text-black/60 uppercase tracking-widest">
              Celebrities, Influencers &amp; Real Brides Dressed in Our Signature Coutures
            </p>
          </header>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {[
              {
                title: "Maya Ali in Iris Royal Blue",
                event: "Hum Style Awards",
                image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-iris-royal-blue-intricate-embroidery.jpg?v=1776742287",
                quote: "The intricate threadwork and regal silhouette made me feel completely divine.",
              },
              {
                title: "Sajal Aly in Freya Sublime Lilac",
                event: "Festive Eid Gala",
                image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-dress-sublime-Lilac-intricate-embroidery.jpg?v=1776332402",
                quote: "Pure effortless glamour. The hand embroidery on the sleeves is pure poetry.",
              },
              {
                title: "Hania Aamir in Camilla Mocha Brown",
                event: "Celebrity Dinner Lahore",
                image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-dress-chamilla-mocha-brown-intricate-embroidery-front.jpg?v=1776332401",
                quote: "Sillhouete knows how to drape the modern woman with understated royalty.",
              },
              {
                title: "Yumna Zaidi in Maraki Light Grey",
                event: "Award Night Red Carpet",
                image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-dress-meraki-light-grey-sequins.jpg?v=1769691351",
                quote: "The subtle shimmer and flawless cut made this my favorite outfit of the season.",
              },
              {
                title: "Dur-e-Fishan in Ayzel Ivory",
                event: "Nikkah Ceremony",
                image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-dress-ayzel-ivory-delicate-embroidery.jpg?v=1768978410",
                quote: "The silver detailing on pure ivory is unmatched. Timeless elegance at its finest.",
              },
              {
                title: "Ayeza Khan in Layl Festive Red",
                event: "Bridal Couture Showcase",
                image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-dress-layal-red-exquisite-embroidery-front.jpg?v=1768978807",
                quote: "Classic bridal heritage crafted with such modern comfort and poise.",
              },
            ].map((spot) => (
              <div key={spot.title} className="border border-line bg-soft overflow-hidden group">
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <img
                    src={spot.image}
                    alt={spot.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-2 left-2 rounded bg-black/80 px-2.5 py-1 text-[11px] font-semibold text-white">
                    {spot.event}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm uppercase tracking-wide">{spot.title}</h3>
                  <p className="text-xs text-black/70 italic">&ldquo;{spot.quote}&rdquo;</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Products Showcase on every info/policy page so no page is left without products */}
      <section className="mt-16 border-t border-line pt-12">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-black/60">Sillhouete Atelier</p>
          <h2 className="heading mt-1 text-[22px] md:text-[28px]">Featured Designer Outfits</h2>
        </div>
        <div className="grid grid-cols-2 gap-[10px] md:grid-cols-4 md:gap-[17px]">
          {allProducts.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </article>
  );
}
