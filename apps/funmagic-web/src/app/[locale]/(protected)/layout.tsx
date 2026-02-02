import { auth } from '@funmagic/auth/server'
import { headers } from 'next/headers'
import { redirect } from '@/i18n/navigation'

interface ProtectedLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function ProtectedLayout({
  children,
  params,
}: ProtectedLayoutProps) {
  const { locale } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect({ href: '/login', locale })
  }

  return <>{children}</>
}
