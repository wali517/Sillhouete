import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogBySlug, getBlogs, getProducts } from "@/lib/db";
import ProductCard from "@/components/products/ProductCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ slug: string; articleSlug: string }> };

export async function generateStaticParams() {
  const blogs = await getBlogs();
  return blogs.map((b) => ({
    slug: "news",
    articleSlug: b.slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { articleSlug } = await params;
  const article = await getBlogBySlug(articleSlug);
  if (!article) return { title: "Article Not Found – Sillhouete" };
  return {
    title: `${article.title} – Sillhouete`,
    description: article.excerpt,
  };
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug, articleSlug } = await params;
  if (slug !== "news") notFound();

  const article = await getBlogBySlug(articleSlug);
  if (!article) notFound();

  const [allArticles, allProds] = await Promise.all([
    getBlogs(),
    getProducts(),
  ]);

  const related = allArticles
    .filter((a) => a.slug !== articleSlug)
    .slice(0, 3);

  const featuredProducts =
    articleSlug.includes("wedding") ||
    articleSlug.includes("bridal") ||
    articleSlug.includes("mehndi")
      ? allProds
          .filter(
            (p) =>
              (p.category || "").toLowerCase().includes("bridal") ||
              (p.category || "").toLowerCase().includes("formal")
          )
          .slice(0, 4)
      : allProds
          .filter(
            (p) =>
              (p.category || "").toLowerCase().includes("pret") ||
              (p.category || "").toLowerCase().includes("silk")
          )
          .slice(0, 4);

  // Parse paragraphs
  const rawParagraphs = article.content.split("\n\n").map((p) => p.trim()).filter(Boolean);
  let firstParagraphRendered = false;

  return (
    <div className="bg-[#f8f6f3] min-h-screen">
      {/* Top Breadcrumb */}
      <div className="border-b border-[#ece8e1] bg-white">
        <div className="mx-auto max-w-300 px-4 py-3.5 sm:px-6">
          <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[1.5px] text-[#888]">
            <Link href="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <span className="text-[#ccc]">/</span>
            <Link href="/blogs/news" className="hover:text-black transition-colors">
              News
            </Link>
            <span className="text-[#ccc]">/</span>
            <span className="text-[#2b2521] font-medium truncate max-w-[320px]">
              {article.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Editorial Article */}
      <article className="editorial-article px-4 pt-12 pb-20 md:pt-16 md:pb-24">
        {/* Editorial Header */}
        <header className="editorial-header max-w-[850px] mx-auto text-center mb-10">
          <span className="editorial-category inline-block text-[11px] uppercase tracking-[2px] text-[#9a7b62] font-semibold mb-3">
            {article.category || "EDITORIAL"}
          </span>

          <h1 className="editorial-title font-serif font-normal text-[32px] sm:text-[44px] md:text-[56px] leading-[1.12] text-[#24201d] mb-4">
            {article.title}
          </h1>

          <div className="editorial-meta flex items-center justify-center flex-wrap gap-4 sm:gap-6 text-[13px] text-[#777] pt-1">
            <span>{formatDate(article.publishedAt)}</span>
            <span className="text-[#ccc] hidden sm:inline">•</span>
            <span>By {article.author || "Sillhouete Editorial"}</span>
            <span className="text-[#ccc] hidden sm:inline">•</span>
            <span>{article.readTime || "5 min read"}</span>
          </div>
        </header>

        {/* Featured Image */}
        {article.coverImage && (
          <div className="editorial-featured-image max-w-[760px] mx-auto mb-12 sm:mb-16">
            <div className="relative aspect-[16/10] sm:aspect-[16/11] w-full overflow-hidden rounded-xs bg-[#eae6de]">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                priority
                sizes="(min-width: 800px) 760px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Editorial Content */}
        <div className="editorial-content max-w-[760px] mx-auto text-[#222]">
          {rawParagraphs.map((paragraph, index) => {
            if (paragraph.startsWith("# ")) {
              // Skip primary h1 since it's already rendered in header
              return null;
            }

            if (paragraph.startsWith("## ")) {
              return (
                <h2
                  key={index}
                  className="font-serif text-[28px] sm:text-[34px] leading-[1.2] text-[#24201d] font-normal mt-10 mb-4 capitalize"
                >
                  {paragraph.replace("## ", "")}
                </h2>
              );
            }

            if (paragraph.startsWith("### ")) {
              return (
                <h3
                  key={index}
                  className="font-serif text-[22px] sm:text-[28px] leading-[1.25] text-[#24201d] font-normal mt-8 mb-3 capitalize"
                >
                  {paragraph.replace("### ", "")}
                </h3>
              );
            }

            if (paragraph.startsWith("- ")) {
              const listItems = paragraph
                .split("\n")
                .map((l) => l.trim())
                .filter((l) => l.startsWith("- "));
              return (
                <ul
                  key={index}
                  className="space-y-2.5 my-5 pl-5 list-disc marker:text-[#9a7b62] text-[16px] sm:text-[17px] leading-[1.8] text-[#333]"
                >
                  {listItems.map((li, i) => {
                    const text = li.replace(/^- /, "");
                    const boldMatch = text.match(/^\*\*(.*?)\*\*:(.*)$/);
                    if (boldMatch) {
                      return (
                        <li key={i}>
                          <strong className="text-[#24201d] font-semibold">
                            {boldMatch[1]}:
                          </strong>
                          {boldMatch[2]}
                        </li>
                      );
                    }
                    return <li key={i}>{text}</li>;
                  })}
                </ul>
              );
            }

            // Regular paragraph with drop-cap on first instance
            const isFirst = !firstParagraphRendered;
            if (isFirst) firstParagraphRendered = true;

            return (
              <p
                key={index}
                className={`text-[16px] sm:text-[17px] leading-[1.9] text-[#2b2521] mb-5 ${
                  isFirst
                    ? "first-letter:float-left first-letter:text-[64px] sm:first-letter:text-[70px] first-letter:leading-[56px] sm:first-letter:leading-[60px] first-letter:pr-2.5 first-letter:pt-1 first-letter:font-serif first-letter:font-semibold first-letter:text-[#24201d]"
                    : ""
                }`}
              >
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="max-w-[760px] mx-auto mt-12 pt-6 border-t border-[#e5e1d8] flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#9a7b62] mr-2">
              Tags:
            </span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="bg-white px-3 py-1 text-[11px] uppercase tracking-wider text-[#555] border border-[#e5e1d8] rounded-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Back Link */}
        <div className="max-w-[760px] mx-auto mt-8">
          <Link
            href="/blogs/news"
            className="inline-block text-[11px] uppercase tracking-[2px] text-[#24201d] border-b border-[#24201d] pb-[6px] hover:opacity-75 transition-opacity font-medium"
          >
            ← Back to All Stories
          </Link>
        </div>
      </article>

      {/* Featured in this story products */}
      {featuredProducts.length > 0 && (
        <section className="bg-white py-16 border-t border-b border-[#eee]">
          <div className="max-w-300 mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-[11px] tracking-[2px] uppercase text-[#9a8065] font-medium block">
                SHOP THE LOOK
              </span>
              <h2 className="font-serif font-normal text-[28px] md:text-[36px] text-[#24201d] mt-2">
                Featured In This Story
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-4">
              {featuredProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Editorial Related Section */}
      {related.length > 0 && (
        <section className="editorial-related bg-[#f8f6f3] py-16 md:py-24">
          <div className="max-w-300 mx-auto px-4 sm:px-6">
            <h2 className="font-serif text-center text-[32px] sm:text-[38px] md:text-[42px] text-[#24201d] font-normal mb-12">
              Related Stories
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {related.map((rel) => (
                <article key={rel.id} className="editorial-card group flex flex-col">
                  <Link
                    href={`/blogs/news/${rel.slug}`}
                    className="relative block w-full aspect-square overflow-hidden bg-[#eae6de]"
                  >
                    <Image
                      src={rel.coverImage}
                      alt={rel.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </Link>

                  <span className="text-[10px] tracking-[2px] uppercase text-[#9a7b62] mt-4 block font-medium">
                    {rel.category}
                  </span>

                  <h3 className="font-serif text-[18px] font-normal leading-[1.3] mt-3 mb-2 text-[#24201d]">
                    <Link href={`/blogs/news/${rel.slug}`} className="hover:underline">
                      {rel.title}
                    </Link>
                  </h3>

                  <p className="text-[14px] leading-[1.7] text-[#777] line-clamp-2 mb-4">
                    {rel.excerpt}
                  </p>

                  <div className="mt-auto">
                    <Link
                      href={`/blogs/news/${rel.slug}`}
                      className="text-[10px] tracking-[2px] uppercase text-[#24201d] border-b border-[#24201d] pb-[6px] inline-block hover:opacity-75 transition-opacity font-medium"
                    >
                      READ MORE
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}