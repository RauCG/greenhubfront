export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-16 bg-white shadow-sm" />
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="h-6 w-56 animate-pulse rounded bg-gray-200" />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-gray-100">
              <div className="aspect-[3/4] animate-pulse bg-gray-100" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
