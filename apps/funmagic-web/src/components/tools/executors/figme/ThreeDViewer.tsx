'use client'

interface ThreeDViewerProps {
  modelUrl: string
  onDownload: () => void
  onReset: () => void
}

export function ThreeDViewer({ modelUrl, onDownload, onReset }: ThreeDViewerProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
          <p className="text-sm">3D Viewer</p>
          <p className="text-xs mt-1 text-gray-500">
            Model ready for download
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onDownload}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Download 3D Model
        </button>

        <button
          type="button"
          onClick={onReset}
          className="bg-muted text-foreground px-6 py-3 rounded-lg font-medium hover:bg-accent transition-colors"
        >
          Create New
        </button>
      </div>
    </div>
  )
}
