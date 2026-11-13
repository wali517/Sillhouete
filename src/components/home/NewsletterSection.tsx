import NewsletterForm from "@/components/ui/NewsletterForm";

export default function NewsletterSection() {
  return (
    <section
      id="newsletter-section-wrapper"
      className="bg-[#f9f9f9] text-[#1c1d1d] py-[50px] md:py-[75px] px-4 md:px-10 text-center"
    >
      <div className="mx-auto max-w-355">
        <div className="mx-auto max-w-2xl">
          <p className="font-serif text-[18px] md:text-[21.25px] font-semibold uppercase tracking-[0.05em] text-[#1c1d1d] leading-tight mb-2.5">
            Subscribe to our newsletter
          </p>
          <div className="enlarge-text">
            <p className="font-serif text-[16px] md:text-[19.5px] text-[#1c1d1d] tracking-[0.025em] leading-[1.4] mb-6 md:mb-7">
              Signup for our newsletter to stay up to date on sales and events.
            </p>
          </div>
          <NewsletterForm
            id="newsletter-section"
            className="mx-auto max-w-[400px] w-full"
          />
        </div>
      </div>
    </section>
  );
}
