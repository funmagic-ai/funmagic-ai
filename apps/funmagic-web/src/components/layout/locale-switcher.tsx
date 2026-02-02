'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { locales, localeNames, type Locale } from '@/i18n/config'
import { useTransition } from 'react'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LocaleSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as Locale
    startTransition(() => {
      router.replace(pathname, { locale: newLocale })
    })
  }

  return (
    <div className="relative flex items-center">
      <Globe className="pointer-events-none absolute left-2 h-4 w-4 text-muted-foreground" />
      <select
        value={locale}
        onChange={handleChange}
        disabled={isPending}
        className={cn(
          'h-9 appearance-none rounded-lg border-none bg-muted py-2 pl-8 pr-8 text-sm font-medium',
          'cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
        aria-label="Select language"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeNames[loc]}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 h-4 w-4 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}
