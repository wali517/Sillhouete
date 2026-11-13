import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogs } from "@/lib/db";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [{ slug: "news" }];
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  if (slug !== "news") return { title: "Blog – Sillhouete" };
  return {
    title: "News – Sillhouete",
    description: "Discover stories, bridal trends, styling guides, and festive traditions by Sillhouete.",
  };
}

export default async function BlogPage({ params }: Props) {
  const { slug } = await params;
  if (slug !== "news") notFound();

  const blogs = await getBlogs();
  const featured = blogs[0];
  const remaining = blogs.slice(1);

  return (
    <div className="bg-white min-h-screen">
      {/* Top Breadcrumb Navigation */}
      <div className="border-b border-[#f0eee9] bg-white">
        <div className="mx-auto max-w-300 px-4 py-3.5 sm:px-6">
          <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[1.5px] text-[#888]">
            <Link href="/" className="transition-colors hover:text-black">
              Home
            </Link>
            <span className="text-[#ccc]">/</span>
            <span className="text-[#2b2521] font-medium">News</span>
          </nav>
        </div>
      </div>

      {/* Featured Editorial Banner */}
      {featured && (
        <section className="featured-blog-editorial py-12 md:py-20 border-b border-[#eee] bg-[#fbf9f6]">
          <div className="max-w-300 mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center">
              <Link
                href={`/blogs/news/${featured.slug}`}
                className="relative block w-full h-90 sm:h-110 md:h-130 overflow-hidden rounded-[3px] bg-[#f2efe9] group"
              >
                <Image
                  src={featured.coverImage}
                  alt={featured.title}
                  fill
                  priority
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </Link>

              <div className="max-w-115 space-y-4">
                <span className="text-[11px] tracking-[2px] uppercase text-[#9b8065] block font-medium">
                  {featured.category || "EDITORIAL FEATURE"}
                </span>

                <h1 className="font-serif font-normal text-[32px] sm:text-[38px] md:text-[42px] leading-[1.15] text-[#2b2521]">
                  <Link href={`/blogs/news/${featured.slug}`} className="hover:opacity-80 transition-opacity">
                    {featured.title}
                  </Link>
                </h1>

                <p className="text-[14px] leading-[1.8] text-[#666]">
                  {featured.excerpt}
                </p>

                <div className="pt-2">
                  <Link
                    href={`/blogs/news/${featured.slug}`}
                    className="text-[11px] tracking-[2px] uppercase text-[#2b2521] border-b border-[#2b2521] pb-2 inline-block hover:opacity-75 transition-opacity font-medium"
                  >
                    READ MORE
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Blog Archive Section */}
      <section className="py-14 md:py-20">
        <div className="max-w-300 mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-[#eee] gap-3">
            <div>
              <span className="text-[11px] tracking-[2px] uppercase text-[#9a8065] font-medium block">
                NEWS &amp; ARTICLES
              </span>
              <h2 className="font-serif font-normal text-[30px] md:text-[38px] text-[#24201d] mt-2">
                Latest Stories
              </h2>
            </div>
            <div className="text-[11px] tracking-[1.5px] uppercase text-[#888]">
              {blogs.length} Stories Published
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {remaining.map((article) => (
              <article key={article.id} className="group flex flex-col">
                <Link
                  href={`/blogs/news/${article.slug}`}
                  className="relative block w-full aspect-4/3 sm:h-87.5 overflow-hidden bg-[#f8f6f3]"
                >
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </Link>

                <span className="text-[10px] tracking-[1.5px] uppercase text-[#9a8065] mt-4.5 block font-medium">
                  {article.category}
                </span>

                <h3 className="font-serif text-[18px] font-normal leading-[1.3] my-3 text-[#24201d]">
                  <Link href={`/blogs/news/${article.slug}`} className="hover:underline">
                    {article.title}
                  </Link>
                </h3>

                <p className="text-[14px] leading-[1.7] text-[#777] mb-5 line-clamp-3">
                  {article.excerpt}
                </p>

                <div className="mt-auto">
                  <Link
                    href={`/blogs/news/${article.slug}`}
                    className="text-[10px] tracking-[2px] uppercase text-[#24201d] border-b border-[#24201d] pb-1.75 inline-block hover:opacity-75 transition-opacity font-medium"
                  >
                    READ MORE
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}