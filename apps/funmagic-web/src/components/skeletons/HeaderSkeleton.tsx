export function HeaderSkeleton() {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="w-32 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
          <nav className="flex items-center space-x-6">
            <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-20 h-9 bg-gray-200 rounded-lg animate-pulse" />
          </nav>
        </div>
      </div>
    </header>
  )
}
