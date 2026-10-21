import NewsletterForm from "@/components/ui/NewsletterForm";

export default function NewsletterSection() {
  return (
    <section className="bg-soft px-5 py-14 text-center text-[#1c1d1d]">
      <div className="mx-auto max-w-xl">
        <h2 className="heading text-[25px]">Subscribe to our newsletter</h2>
        <p className="mt-4 text-[17px]">Signup for our newsletter to stay up to date on sales and events.</p>
        <NewsletterForm id="newsletter-section" className="mt-6 text-left" />
      </div>
    </section>
  );
}
