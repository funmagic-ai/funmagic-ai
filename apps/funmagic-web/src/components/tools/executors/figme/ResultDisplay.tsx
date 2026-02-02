'use client'

interface ResultDisplayProps {
  imageUrl: string
  onSave: () => void
  onGenerate3D?: () => void
  onReset: () => void
  isSaving?: boolean
  isGenerating3D?: boolean
  threeDCost?: number
}

export function ResultDisplay({
  imageUrl,
  onSave,
  onGenerate3D,
  onReset,
  isSaving = false,
  isGenerating3D = false,
  threeDCost = 30,
}: ResultDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-100 rounded-lg p-4">
        <img
          src={imageUrl}
          alt="Generated result"
          className="max-h-96 mx-auto rounded-lg object-contain"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save to Assets'}
        </button>

        {onGenerate3D && (
          <button
            type="button"
            onClick={onGenerate3D}
            disabled={isGenerating3D}
            className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating3D
              ? 'Generating...'
              : `Generate 3D (${threeDCost} credits)`}
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  )
}
