'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) {
      setTheme(stored)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (theme === 'system') {
      localStorage.removeItem('theme')
      root.classList.toggle('dark', systemDark)
    } else {
      localStorage.setItem('theme', theme)
      root.classList.toggle('dark', theme === 'dark')
    }
  }, [theme, mounted])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        document.documentElement.classList.toggle('dark', mediaQuery.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  if (!mounted) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/60 border border-border/50">
        <div className="h-5 w-5 animate-pulse rounded bg-muted-foreground/20" />
      </div>
    )
  }

  const options: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  return (
    <div className="flex items-center gap-1 rounded-lg bg-background/60 border border-border/50 p-1">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
            theme === value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title={label}
          aria-label={`Switch to ${label} theme`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}
