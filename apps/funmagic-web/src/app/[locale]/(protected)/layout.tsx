import { Suspense } from 'react'
import { auth } from '@funmagic/auth/server'
import { headers } from 'next/headers'
import { redirect } from '@/i18n/navigation'
import { connection } from 'next/server'

interface ProtectedLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

async function AuthGate({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  await connection()
  const { locale } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect({ href: '/login', locale })
  }

  return <>{children}</>
}

function AuthLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  )
}

export default async function ProtectedLayout({
  children,
  params,
}: ProtectedLayoutProps) {
  return (
    <Suspense fallback={<AuthLoadingSkeleton />}>
      <AuthGate params={params}>{children}</AuthGate>
    </Suspense>
  )
}
