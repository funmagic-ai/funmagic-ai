import { headers } from 'next/headers'
import { auth, type Session } from '@funmagic/auth/server'
import { SessionProvider } from './session-provider'

export async function SessionFetcher({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() }) as Session | null

  return (
    <SessionProvider initialSession={session}>
      {children}
    </SessionProvider>
  )
}
