export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/40 bg-background/80 px-4 py-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-9 w-20 animate-pulse rounded bg-muted" />
      </div>
    </header>
  )
}
