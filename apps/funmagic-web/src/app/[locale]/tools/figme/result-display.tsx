'use client'

import { Button } from '@/components/ui/button'

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
      <div className="bg-muted rounded-lg p-4">
        <img
          src={imageUrl}
          alt="Generated result"
          className="max-h-96 mx-auto rounded-lg object-contain"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isSaving ? 'Saving...' : 'Save to Assets'}
        </Button>

        {onGenerate3D && (
          <Button
            onClick={onGenerate3D}
            disabled={isGenerating3D}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating3D
              ? 'Generating...'
              : `Generate 3D (${threeDCost} credits)`}
          </Button>
        )}

        <Button
          variant="secondary"
          onClick={onReset}
          className="flex-1 sm:flex-none"
        >
          Start Over
        </Button>
      </div>
    </div>
  )
}
