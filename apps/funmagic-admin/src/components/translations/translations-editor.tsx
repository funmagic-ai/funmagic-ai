'use client'

import { useState, useCallback } from 'react'
import { Code, FormInput } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  type SupportedLocale,
} from '@funmagic/shared'

interface TranslationField {
  name: string
  label: string
  required?: boolean
  maxLength?: number
  rows?: number
  placeholder?: string
}

interface TranslationsEditorProps<T extends Record<string, unknown>> {
  translations: T
  onChange: (translations: T) => void
  fields: TranslationField[]
  title?: string
  description?: string
}

export function TranslationsEditor<T extends Record<string, unknown>>({
  translations,
  onChange,
  fields,
  title = 'Localized Content',
  description = 'Content displayed in each language',
}: TranslationsEditorProps<T>) {
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>(DEFAULT_LOCALE)
  const [jsonMode, setJsonMode] = useState(true)
  const [jsonError, setJsonError] = useState<string | null>(null)

  // Check if a locale has any content
  const hasTranslation = useCallback(
    (locale: SupportedLocale) => {
      const localeData = translations[locale]
      if (!localeData || typeof localeData !== 'object') return false
      return Object.values(localeData as Record<string, unknown>).some(
        (v) => v !== undefined && v !== null && v !== ''
      )
    },
    [translations]
  )

  // Update a specific field for the active locale
  const updateField = useCallback(
    (fieldName: string, value: string) => {
      const currentLocaleData = (translations[activeLocale] ?? {}) as Record<string, unknown>
      const newTranslations = {
        ...translations,
        [activeLocale]: {
          ...currentLocaleData,
          [fieldName]: value || undefined,
        },
      }
      onChange(newTranslations as T)
    },
    [translations, activeLocale, onChange]
  )

  // Handle JSON mode changes
  const handleJsonChange = useCallback(
    (jsonString: string) => {
      try {
        const parsed = JSON.parse(jsonString)
        setJsonError(null)
        onChange(parsed as T)
      } catch {
        setJsonError('Invalid JSON format')
      }
    },
    [onChange]
  )

  const currentLocaleData = (translations[activeLocale] ?? {}) as Record<string, string | undefined>

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => setJsonMode(!jsonMode)}
          className="h-8 gap-1"
        >
          {jsonMode ? <FormInput className="h-4 w-4" /> : <Code className="h-4 w-4" />}
          {jsonMode ? 'Form' : 'JSON'}
        </Button>
      </CardHeader>
      <CardContent>
        {jsonMode ? (
          <div className="space-y-2">
            <Textarea
              value={JSON.stringify(translations, null, 2)}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            {jsonError && <p className="text-destructive text-xs">{jsonError}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Locale selector */}
            <div className="flex items-center gap-3">
              <Label className="shrink-0">Language:</Label>
              <Select value={activeLocale} onValueChange={(v) => setActiveLocale(v as SupportedLocale)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LOCALES.map((locale) => (
                    <SelectItem key={locale} value={locale}>
                      {LOCALE_LABELS[locale]}
                      {locale === DEFAULT_LOCALE && ' (required)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Locale status indicators */}
              <div className="flex gap-1 ml-2">
                {SUPPORTED_LOCALES.map((locale) => (
                  <span
                    key={locale}
                    className={cn(
                      'w-2 h-2 rounded-full',
                      hasTranslation(locale) ? 'bg-green-500' : 'bg-muted'
                    )}
                    title={`${LOCALE_LABELS[locale]}: ${hasTranslation(locale) ? 'has content' : 'empty'}`}
                  />
                ))}
              </div>
            </div>

            {/* Form fields for selected locale */}
            <div className="space-y-4 pt-2">
              {fields.map((field) => (
                <div key={field.name} className="grid gap-2">
                  <Label htmlFor={`${activeLocale}-${field.name}`}>
                    {field.label}
                    {activeLocale === DEFAULT_LOCALE && field.required ? (
                      <span className="text-destructive"> *</span>
                    ) : (
                      <span className="text-muted-foreground text-xs ml-1">
                        (falls back to English)
                      </span>
                    )}
                  </Label>
                  <Textarea
                    id={`${activeLocale}-${field.name}`}
                    value={currentLocaleData[field.name] ?? ''}
                    onChange={(e) => updateField(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    rows={field.rows ?? 2}
                    maxLength={field.maxLength}
                  />
                  {field.maxLength && (
                    <p className="text-muted-foreground text-xs">
                      {(currentLocaleData[field.name] ?? '').length}/{field.maxLength} characters
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
