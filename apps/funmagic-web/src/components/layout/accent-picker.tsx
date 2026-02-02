'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const accents = [
  { value: 'purple', color: '#3713ec', label: 'Purple' },
  { value: 'blue', color: '#2563eb', label: 'Blue' },
  { value: 'green', color: '#16a34a', label: 'Green' },
  { value: 'orange', color: '#ea580c', label: 'Orange' },
  { value: 'pink', color: '#db2777', label: 'Pink' },
] as const

type Accent = (typeof accents)[number]['value']

export function AccentPicker() {
  const [accent, setAccent] = useState<Accent>('purple')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('accent') as Accent | null
    if (stored && accents.some((a) => a.value === stored)) {
      setAccent(stored)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    localStorage.setItem('accent', accent)
    document.documentElement.dataset.accent = accent
  }, [accent, mounted])

  if (!mounted) {
    return (
      <div className="flex gap-2">
        {accents.map((a) => (
          <div
            key={a.value}
            className="h-6 w-6 animate-pulse rounded-full bg-muted"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {accents.map((a) => (
        <button
          key={a.value}
          type="button"
          onClick={() => setAccent(a.value)}
          className={cn(
            'h-6 w-6 rounded-full transition-transform',
            accent === a.value && 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110'
          )}
          style={{ backgroundColor: a.color }}
          title={a.label}
          aria-label={`Switch to ${a.label} accent`}
        />
      ))}
    </div>
  )
}
