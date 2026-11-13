export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="relative aspect-[2/3] w-full bg-neutral-200/80 overflow-hidden" />
      <div className="mt-3 space-y-2 px-1 text-center">
        <div className="mx-auto h-3.5 w-3/4 bg-neutral-200/90 rounded-sm" />
        <div className="mx-auto h-3 w-1/3 bg-neutral-200/70 rounded-sm" />
      </div>
    </div>
  );
}

export function CollectionSectionSkeleton({
  title,
  count = 8,
}: {
  title?: string;
  count?: number;
}) {
  return (
    <section className="mx-auto w-full max-w-355 px-3.5 py-8 sm:px-6 sm:py-10 md:px-10 md:py-12">
      <div className="mb-6 text-center md:mb-8">
        {title ? (
          <h2 className="text-[16px] font-semibold uppercase leading-none tracking-wider text-[#111111] sm:text-[17px] md:text-[20px]">
            {title}
          </h2>
        ) : (
          <div className="mx-auto h-5 w-48 bg-neutral-200 rounded-sm animate-pulse" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8 md:grid-cols-4 lg:gap-x-6">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative w-full aspect-[4/5] md:aspect-[16/7] bg-neutral-200/80 animate-pulse overflow-hidden" />
  );
}

export function MediaGridSkeleton() {
  return (
    <section className="mx-auto w-full max-w-355 px-3.5 py-8 sm:px-6 md:px-10 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="aspect-[4/5] md:aspect-[16/10] bg-neutral-200/80 rounded-sm" />
        <div className="aspect-[4/5] md:aspect-[16/10] bg-neutral-200/80 rounded-sm" />
      </div>
    </section>
  );
}

export function CollectionPageSkeleton() {
  return (
    <section className="mx-auto w-full max-w-380 px-3.5 py-6 sm:px-6 md:px-8 lg:px-10 md:py-8 animate-pulse">
      <div className="mb-10 mt-4 text-center">
        <div className="mx-auto h-7 w-56 bg-neutral-200 rounded-sm" />
      </div>
      <div className="mb-6 flex items-center justify-between border-b border-neutral-100 pb-3">
        <div className="h-4 w-36 bg-neutral-200 rounded-sm" />
        <div className="h-8 w-32 bg-neutral-200 rounded-sm" />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function ProductDetailSkeleton() {
  return (
    <section className="mx-auto w-full max-w-355 px-4 py-8 md:px-10 md:py-12 animate-pulse">
      <div className="grid gap-8 md:grid-cols-12">
        {/* Gallery */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="aspect-[3/4] bg-neutral-200/80" />
          <div className="aspect-[3/4] bg-neutral-200/80 hidden sm:block" />
        </div>
        {/* Details */}
        <div className="md:col-span-5 space-y-5 pt-2">
          <div className="h-4 w-28 bg-neutral-200 rounded-sm" />
          <div className="h-7 w-3/4 bg-neutral-200 rounded-sm" />
          <div className="h-6 w-32 bg-neutral-200 rounded-sm" />
          <div className="space-y-2 pt-4">
            <div className="h-3 w-20 bg-neutral-200 rounded-sm" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 w-12 bg-neutral-200 rounded-sm" />
              ))}
            </div>
          </div>
          <div className="h-12 w-full bg-neutral-300 rounded-sm mt-6" />
          <div className="space-y-2 pt-6">
            <div className="h-3.5 w-full bg-neutral-200/70 rounded-sm" />
            <div className="h-3.5 w-5/6 bg-neutral-200/70 rounded-sm" />
            <div className="h-3.5 w-4/6 bg-neutral-200/70 rounded-sm" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function BlogListSkeleton() {
  return (
    <section className="mx-auto w-full max-w-[1380px] px-4 py-8 md:px-10 md:py-12 animate-pulse">
      <div className="mb-10 text-center">
        <div className="mx-auto h-8 w-40 bg-neutral-200 rounded-sm" />
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[4/3] w-full bg-neutral-200/80" />
            <div className="h-5 w-4/5 bg-neutral-200 rounded-sm" />
            <div className="h-3.5 w-full bg-neutral-200/70 rounded-sm" />
            <div className="h-3.5 w-2/3 bg-neutral-200/70 rounded-sm" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <article className="mx-auto w-full max-w-[900px] px-4 py-10 md:py-16 animate-pulse">
      <div className="space-y-4 text-center mb-10">
        <div className="mx-auto h-4 w-32 bg-neutral-200/80 rounded-sm" />
        <div className="mx-auto h-8 w-3/4 bg-neutral-200 rounded-sm" />
        <div className="mx-auto h-3 w-40 bg-neutral-200/60 rounded-sm" />
      </div>
      <div className="aspect-[16/9] w-full bg-neutral-200/80 mb-10 rounded-sm" />
      <div className="space-y-4 max-w-[760px] mx-auto">
        <div className="h-4 w-full bg-neutral-200/80 rounded-sm" />
        <div className="h-4 w-11/12 bg-neutral-200/80 rounded-sm" />
        <div className="h-4 w-4/5 bg-neutral-200/80 rounded-sm" />
        <div className="h-4 w-full bg-neutral-200/80 rounded-sm pt-4" />
        <div className="h-4 w-5/6 bg-neutral-200/80 rounded-sm" />
      </div>
    </article>
  );
}

export function CartPageSkeleton() {
  return (
    <section className="mx-auto max-w-310 px-4 sm:px-6 md:px-8 py-10 md:py-14 animate-pulse">
      <div className="text-center mb-10">
        <div className="mx-auto h-8 w-24 bg-neutral-200 rounded-sm" />
        <div className="mx-auto h-3 w-36 bg-neutral-200/70 rounded-sm mt-3" />
      </div>
      <div className="space-y-6 max-w-240 mx-auto">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-neutral-100 pb-6 items-center">
            <div className="w-20 h-28 bg-neutral-200/80 rounded-sm shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-neutral-200 rounded-sm" />
              <div className="h-3 w-24 bg-neutral-200/70 rounded-sm" />
              <div className="h-4 w-20 bg-neutral-200 rounded-sm pt-2" />
            </div>
            <div className="w-24 h-9 bg-neutral-200/70 rounded-sm" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function StaticPageSkeleton() {
  return (
    <article className="mx-auto w-full max-w-[1050px] px-4 py-8 md:px-8 md:py-14 animate-pulse">
      <div className="text-center border-b border-neutral-100 pb-8 mb-8">
        <div className="mx-auto h-8 w-64 bg-neutral-200 rounded-sm" />
        <div className="mx-auto h-3.5 w-48 bg-neutral-200/70 rounded-sm mt-3" />
      </div>
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="h-4 w-full bg-neutral-200/80 rounded-sm" />
        <div className="h-4 w-11/12 bg-neutral-200/80 rounded-sm" />
        <div className="h-4 w-5/6 bg-neutral-200/80 rounded-sm" />
        <div className="h-4 w-full bg-neutral-200/80 rounded-sm pt-4" />
        <div className="h-4 w-3/4 bg-neutral-200/80 rounded-sm" />
      </div>
    </article>
  );
}
