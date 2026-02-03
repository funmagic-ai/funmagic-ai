'use client'

import { useState, useTransition } from 'react'
import { useSessionContext } from '@/components/providers/session-provider'
import { authClient } from '@/lib/auth-client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function UserSettings() {
  const t = useTranslations('profile')
  const router = useRouter()
  const { session } = useSessionContext()
  const [isEditingName, setIsEditingName] = useState(false)
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!session) {
    return null
  }

  const handleEditName = () => {
    setName(session.user.name || '')
    setIsEditingName(true)
    setError(null)
  }

  const handleCancelEdit = () => {
    setIsEditingName(false)
    setName('')
    setError(null)
  }

  const handleSaveName = async () => {
    if (!name.trim()) {
      setError(t('settings.nameRequired'))
      return
    }

    startTransition(async () => {
      try {
        const result = await authClient.updateUser({ name: name.trim() })

        if (result.error) {
          setError(result.error.message || t('settings.updateError'))
          return
        }

        router.refresh()
        setIsEditingName(false)
        setName('')
      } catch {
        setError(t('settings.updateError'))
      }
    })
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-foreground mb-6">
        {t('accountSettings')}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('settings.name')}
          </label>
          {isEditingName ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('settings.enterName')}
                  disabled={isPending}
                  autoFocus
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSaveName}
                  disabled={isPending}
                  className="text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelEdit}
                  disabled={isPending}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-foreground">
                {session.user.name || t('settings.notSet')}
              </p>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleEditName}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('settings.email')}
          </label>
          <p className="text-foreground">{session.user.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('settings.emailNote')}
          </p>
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium text-foreground mb-3">
            {t('settings.preferences')}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('settings.emailNotifications')}
              </span>
              <button
                type="button"
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-primary transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-primary-foreground shadow ring-0 transition duration-200 ease-in-out" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
