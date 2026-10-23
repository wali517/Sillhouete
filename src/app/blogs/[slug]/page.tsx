import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, ArrowRight, User } from "lucide-react";
import { getBlogs } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [{ slug: "news" }];
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  if (slug !== "news") return { title: "Blog – Sillhouete" };
  return {
    title: "News & Fashion Journal – Sillhouete",
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
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-8">
      {/* Blog Header */}
      <header className="mb-10 text-center border-b border-line pb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-black/60">Sillhouete Journal</p>
        <h1 className="heading mt-2 text-[32px] md:text-[44px]">Editorial &amp; News</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-black/70">
          Bridal guides, silhouette breakdowns, styling advice, and timeless cultural heritage.
        </p>
      </header>

      {/* Featured Editorial Banner */}
      {featured && (
        <section className="mb-16 border border-line bg-soft overflow-hidden">
          <div className="grid lg:grid-cols-2 items-center">
            <div className="relative aspect-[16/10] lg:aspect-auto lg:h-[460px] w-full">
              <Image
                src={featured.coverImage}
                alt={featured.title}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="p-6 md:p-12 space-y-4">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-[#9b8065]">
                {featured.category || "Editorial Feature"}
              </span>
              <h2 className="heading text-[26px] md:text-[34px] leading-tight text-black">
                <Link href={`/blogs/news/${featured.slug}`} className="hover:underline">
                  {featured.title}
                </Link>
              </h2>
              <p className="text-sm text-black/70 line-clamp-3 leading-relaxed">
                {featured.excerpt}
              </p>
              <div className="flex items-center gap-4 text-xs text-black/60 pt-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {featured.publishedAt}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {featured.readTime}
                </span>
              </div>
              <div className="pt-3">
                <Link
                  href={`/blogs/news/${featured.slug}`}
                  className="btn text-xs py-3.5 px-6 tracking-[0.2em] inline-flex items-center gap-2"
                >
                  <span>Read The Story</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="space-y-6">
        <h2 className="heading text-[22px] border-b border-line pb-3">Latest Stories</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {remaining.map((article) => (
            <article
              key={article.id}
              className="group flex flex-col border border-line bg-white transition-shadow hover:shadow-md"
            >
              <Link
                href={`/blogs/news/${article.slug}`}
                className="relative aspect-[16/11] w-full overflow-hidden bg-soft"
              >
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
              <div className="flex flex-1 flex-col p-5 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[#9b8065] font-semibold uppercase tracking-wider">
                  <span>{article.category}</span>
                  <span className="text-black/50">{article.readTime}</span>
                </div>
                <h3 className="heading text-[18px] leading-snug">
                  <Link href={`/blogs/news/${article.slug}`} className="hover:underline">
                    {article.title}
                  </Link>
                </h3>
                <p className="text-xs text-black/70 line-clamp-3 leading-relaxed">
                  {article.excerpt}
                </p>
                <div className="mt-auto pt-3 border-t border-line/60 flex items-center justify-between text-xs">
                  <span className="text-black/60">{article.publishedAt}</span>
                  <Link
                    href={`/blogs/news/${article.slug}`}
                    className="font-bold uppercase tracking-wider text-black underline underline-offset-4 hover:text-black/70"
                  >
                    Read More →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
