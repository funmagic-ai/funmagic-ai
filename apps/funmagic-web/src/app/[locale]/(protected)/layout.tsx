export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      {children}
    </div>
  )
}
