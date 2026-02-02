'use client'

import type { StyleReference } from '@/lib/types/tool-configs'

interface StyleSelectorProps {
  styles: StyleReference[]
  selectedStyleId: string | null
  onSelect: (styleId: string) => void
  disabled?: boolean
}

export function StyleSelector({
  styles,
  selectedStyleId,
  onSelect,
  disabled = false,
}: StyleSelectorProps) {
  if (styles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No styles available. Please contact support.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Select a Style</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {styles.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => !disabled && onSelect(style.id)}
            disabled={disabled}
            className={`relative rounded-lg overflow-hidden border-2 transition-all ${
              selectedStyleId === style.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="aspect-square bg-gray-100">
              {style.imageUrl ? (
                <img
                  src={style.imageUrl}
                  alt={style.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>
            <div className="p-2 bg-white">
              <p className="text-sm font-medium text-gray-900 truncate">
                {style.name}
              </p>
            </div>
            {selectedStyleId === style.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
