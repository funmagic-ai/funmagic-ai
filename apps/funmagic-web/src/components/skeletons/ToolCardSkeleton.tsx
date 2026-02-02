export function ToolCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border animate-pulse">
      <div className="w-full h-40 bg-gray-200 rounded-lg mb-4" />
      <div className="w-3/4 h-6 bg-gray-200 rounded mb-2" />
      <div className="w-full h-4 bg-gray-200 rounded mb-1" />
      <div className="w-2/3 h-4 bg-gray-200 rounded" />
    </div>
  )
}

export function ToolGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ToolCardSkeleton key={i} />
      ))}
    </div>
  )
}
