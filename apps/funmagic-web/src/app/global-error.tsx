'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center max-w-md">
            <div className="inline-flex p-4 bg-red-100 dark:bg-red-950 rounded-full mb-6">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-4">
              Something went wrong
            </h1>

            <p className="text-muted-foreground mb-8">
              An unexpected error occurred. Please try again.
            </p>

            {error.digest && (
              <p className="text-xs text-muted-foreground mb-6">
                Error code: {error.digest}
              </p>
            )}

            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
