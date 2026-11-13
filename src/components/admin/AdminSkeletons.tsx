export function AdminMetricsCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-8 bg-gray-100 rounded-lg" />
          </div>
          <div className="h-7 w-28 bg-gray-200 rounded" />
          <div className="h-3 w-36 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}

export function AdminTableSkeleton({
  columns = ["Item", "Category", "Price", "Status", "Actions"],
  rows = 8,
}: {
  columns?: string[];
  rows?: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden animate-pulse">
      {/* Search & Filter Bar Placeholder */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3 items-center justify-between bg-gray-50/50">
        <div className="h-9 w-64 bg-gray-200 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-gray-200 rounded-lg" />
          <div className="h-9 w-24 bg-gray-200 rounded-lg" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 uppercase tracking-wider text-gray-400 font-semibold">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="py-3 px-4">
                  <div className="h-3.5 w-16 bg-gray-200 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx} className="hover:bg-gray-50/50">
                {columns.map((_, cIdx) => (
                  <td key={cIdx} className="py-3.5 px-4">
                    {cIdx === 0 ? (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 bg-gray-200 rounded-md" />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="h-3.5 w-36 bg-gray-200 rounded" />
                          <div className="h-2.5 w-20 bg-gray-100 rounded" />
                        </div>
                      </div>
                    ) : cIdx === columns.length - 1 ? (
                      <div className="flex items-center gap-2 justify-end">
                        <div className="h-7 w-7 bg-gray-100 rounded" />
                        <div className="h-7 w-7 bg-gray-100 rounded" />
                      </div>
                    ) : cIdx === 1 ? (
                      <div className="h-5 w-20 bg-gray-100 rounded-full" />
                    ) : (
                      <div className="h-3.5 w-16 bg-gray-200 rounded" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminMessagesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-14 bg-gray-100 rounded" />
            </div>
            <div className="h-4 w-4 bg-gray-200 rounded" />
          </div>
          <div className="h-3 w-48 bg-gray-200 rounded" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-3/4 bg-gray-100 rounded" />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <div className="h-2.5 w-24 bg-gray-200 rounded" />
            <div className="h-2.5 w-32 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminCategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-lg bg-gray-200 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="h-3 w-16 bg-gray-100 rounded" />
            <div className="flex gap-2">
              <div className="h-7 w-7 bg-gray-100 rounded" />
              <div className="h-7 w-7 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminSettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl animate-pulse">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-200 rounded-lg" />
        ))}
      </div>

      {/* Form Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="space-y-2">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="h-3 w-64 bg-gray-100 rounded" />
        </div>
        <div className="space-y-4 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3.5 w-28 bg-gray-200 rounded" />
              <div className="h-10 w-full bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="pt-4 flex justify-end">
          <div className="h-10 w-32 bg-gray-900/40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function AdminDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gray-200 rounded-lg" />
          <div className="space-y-2">
            <div className="h-6 w-44 bg-gray-200 rounded" />
            <div className="h-3.5 w-32 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="h-9 w-28 bg-gray-200 rounded-lg" />
      </div>

      {/* 3 Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3">
            <div className="h-3.5 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-36 bg-gray-100 rounded" />
            <div className="h-3 w-28 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main Details Box */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-md" />
              <div className="space-y-1">
                <div className="h-3.5 w-32 bg-gray-200 rounded" />
                <div className="h-2.5 w-16 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-[#f8f9fa] text-gray-900 font-sans">
      {/* Sidebar Skeleton */}
      <aside className="hidden md:flex w-64 flex-col border-r border-gray-200 bg-white p-4 space-y-6">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-12 bg-gray-900/40 rounded animate-pulse" />
        </div>
        <div className="space-y-2 flex-1 animate-pulse">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50">
              <div className="h-4 w-4 bg-gray-200 rounded" />
              <div className="h-3.5 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-3.5 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </header>
        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full">
          <div className="space-y-2 animate-pulse">
            <div className="h-7 w-48 bg-gray-200 rounded" />
            <div className="h-3.5 w-72 bg-gray-100 rounded" />
          </div>
          <AdminMetricsCardsSkeleton count={4} />
          <AdminTableSkeleton rows={6} />
        </main>
      </div>
    </div>
  );
}

