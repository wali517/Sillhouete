export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-gray-200 rounded-lg" />
        <div className="h-4 w-72 bg-gray-200/70 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-xs space-y-3">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-7 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-6 shadow-xs space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-full bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

