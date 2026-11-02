import NewsletterForm from "@/components/ui/NewsletterForm";

export default function NewsletterSection() {
  return (
    <section
      id="newsletter-section-wrapper"
      className="bg-soft text-[#1c1d1d] py-14 md:py-18.75 px-4 md:px-10 text-center"
    >
      <div className="mx-auto max-w-355">
        <div className="mx-auto max-w-2xl">
          <p className="text-[16px] sm:text-[17px] md:text-[20px] font-semibold uppercase tracking-wider text-[#1c1d1d] leading-tight font-Halant">
            Subscribe to our newsletter
          </p>
          <div className="enlarge-text">
            <p className="text-[15px] md:text-[18px] text-[#1c1d1d] mt-3.5 mb-7">
              Signup for our newsletter to stay up to date on sales and events.
            </p>
          </div>
          <NewsletterForm
            id="newsletter-section"
            className="mx-auto max-w-73 md:max-w-95.5"
          />
        </div>
      </div>
    </section>
  );
}
