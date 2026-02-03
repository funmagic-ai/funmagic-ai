'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { locales, localeNames, type Locale } from '@/i18n/config'
import { useTransition } from 'react'
import { Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function LocaleSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleChange = (newLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale as Locale })
    })
  }

  return (
    <Select value={locale} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger
        className="h-9 min-w-[100px] gap-1.5 border-none bg-transparent"
        aria-label="Select language"
      >
        <Globe className="h-4 w-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-border/50">
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {localeNames[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
