export function FooterSkeleton() {
  return (
    <footer className="mt-auto border-t border-border bg-card py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-4 md:flex-row sm:px-6 lg:px-8">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
    </footer>
  )
}
