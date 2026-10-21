import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, ArrowLeft, Share2, Tag, User } from "lucide-react";
import { getBlogBySlug, getBlogs } from "@/lib/db";
import { SEED_BLOGS } from "@/data/seed-blogs";
import { allProducts } from "@/data/products";
import ProductCard from "@/components/products/ProductCard";

type Props = { params: Promise<{ slug: string; articleSlug: string }> };

export function generateStaticParams() {
  return SEED_BLOGS.map((b) => ({
    slug: "news",
    articleSlug: b.slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { articleSlug } = await params;
  const article = await getBlogBySlug(articleSlug);
  if (!article) return { title: "Article Not Found – Sillhouete" };
  return {
    title: `${article.title} – Sillhouete Journal`,
    description: article.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug, articleSlug } = await params;
  if (slug !== "news") notFound();

  const article = await getBlogBySlug(articleSlug);
  if (!article) notFound();

  const allArticles = await getBlogs();
  const related = allArticles.filter((a) => a.slug !== articleSlug).slice(0, 3);
  const featuredProducts = articleSlug.includes("wedding") || articleSlug.includes("bridal")
    ? allProducts.filter((p) => (p.category || "").toLowerCase().includes("bridal") || (p.category || "").toLowerCase().includes("formal")).slice(0, 4)
    : allProducts.filter((p) => (p.category || "").toLowerCase().includes("pret") || (p.category || "").toLowerCase().includes("silk")).slice(0, 4);

  return (
    <article className="mx-auto max-w-[960px] px-4 py-10 md:px-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/blogs/news"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-black/70 hover:text-black"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Journal</span>
        </Link>
      </div>

      {/* Article Header */}
      <header className="space-y-4 border-b border-line pb-8">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#9b8065]">
          {article.category}
        </span>
        <h1 className="heading text-[30px] md:text-[44px] leading-tight text-black">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-black/60 pt-2">
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            {article.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {article.publishedAt}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {article.readTime}
          </span>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative my-8 aspect-[16/9] w-full overflow-hidden border border-line bg-soft">
        <Image
          src={article.coverImage}
          alt={article.title}
          fill
          priority
          sizes="(min-width: 1024px) 960px, 100vw"
          className="object-cover"
        />
      </div>

      {/* Article Body */}
      <div className="prose prose-neutral max-w-none space-y-6 text-[16px] leading-relaxed text-black/85">
        {article.content.split("\n\n").map((paragraph, index) => {
          const trimmed = paragraph.trim();
          if (!trimmed) return null;

          if (trimmed.startsWith("# ")) {
            return null; // Skip main h1 since it's in the header
          }
          if (trimmed.startsWith("## ")) {
            return (
              <h2 key={index} className="heading text-[22px] md:text-[26px] mt-8 mb-4 text-black border-b border-line/60 pb-2">
                {trimmed.replace("## ", "")}
              </h2>
            );
          }
          if (trimmed.startsWith("- ")) {
            const listItems = trimmed.split("\n").filter((l) => l.trim().startsWith("- "));
            return (
              <ul key={index} className="list-disc pl-6 space-y-2 text-sm md:text-base my-4">
                {listItems.map((li, i) => (
                  <li key={i}>{li.replace(/^- \*\*(.*?)\*\*:/, "<strong>$1</strong>:").replace(/^- /, "")}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={index} className="text-black/80">
              {trimmed}
            </p>
          );
        })}
      </div>

      {/* Tags and Share */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-b border-line py-5">
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="h-4 w-4 text-black/50" />
          <span className="text-xs font-semibold uppercase text-black/60">Tags:</span>
          {article.tags.map((t) => (
            <span
              key={t}
              className="rounded bg-soft px-2.5 py-1 text-xs text-black/80 border border-line"
            >
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* Featured Outfits From This Story */}
      {featuredProducts.length > 0 && (
        <section className="mt-14 space-y-6">
          <div className="border-b border-line pb-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#9b8065]">Shop The Edit</span>
            <h2 className="heading text-[22px] text-black">Featured In This Story</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="mt-16 space-y-6">
          <h2 className="heading text-[22px] border-b border-line pb-3">Related Stories</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {related.map((rel) => (
              <div key={rel.id} className="border border-line bg-soft group overflow-hidden">
                <Link href={`/blogs/news/${rel.slug}`} className="relative aspect-[16/10] block overflow-hidden">
                  <Image
                    src={rel.coverImage}
                    alt={rel.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
                <div className="p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#9b8065]">
                    {rel.category}
                  </span>
                  <h3 className="heading text-[14px] leading-snug line-clamp-2">
                    <Link href={`/blogs/news/${rel.slug}`} className="hover:underline">
                      {rel.title}
                    </Link>
                  </h3>
                  <p className="text-[11px] text-black/60">{rel.publishedAt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
