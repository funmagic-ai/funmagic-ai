'use client'

import { useState, useTransition } from 'react'
import { useSession, updateUser } from '@/lib/auth-client'
import { useTranslations } from 'next-intl'
import { Pencil, Check, X, Loader2 } from 'lucide-react'

export function UserSettings() {
  const t = useTranslations('profile')
  const { data: session, refetch } = useSession()
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
        const result = await updateUser({ name: name.trim() })

        if (result.error) {
          setError(result.error.message || t('settings.updateError'))
          return
        }

        await refetch()
        setIsEditingName(false)
        setName('')
      } catch {
        setError(t('settings.updateError'))
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        {t('accountSettings')}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('settings.name')}
          </label>
          {isEditingName ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('settings.enterName')}
                  disabled={isPending}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                />
                <button
                  onClick={handleSaveName}
                  disabled={isPending}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isPending}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-gray-900">
                {session.user.name || t('settings.notSet')}
              </p>
              <button
                onClick={handleEditName}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('settings.email')}
          </label>
          <p className="text-gray-900">{session.user.email}</p>
          <p className="text-xs text-gray-500 mt-1">
            {t('settings.emailNote')}
          </p>
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {t('settings.preferences')}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {t('settings.emailNotifications')}
              </span>
              <button
                type="button"
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
