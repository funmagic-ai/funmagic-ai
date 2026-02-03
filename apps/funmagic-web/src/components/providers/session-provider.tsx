'use client'

import { createContext, use } from 'react'
import type { Session } from '@funmagic/auth/server'

interface SessionContextValue {
  session: Session | null
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode
  initialSession: Session | null
}) {
  // Use prop directly - router.refresh() triggers full re-render with new props
  // No useState needed since session updates come from server re-render, not client state
  return (
    <SessionContext value={{ session: initialSession }}>
      {children}
    </SessionContext>
  )
}

export function useSessionContext() {
  const ctx = use(SessionContext)
  if (!ctx) throw new Error('useSessionContext must be used within SessionProvider')
  return ctx
}
