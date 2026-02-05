'use client'

import { Button } from '@/components/ui/button'
import { Globe, Download, RefreshCw } from 'lucide-react'

interface ThreeDViewerProps {
  modelUrl: string
  onDownload: () => void
  onReset: () => void
}

export function ThreeDViewer({ modelUrl, onDownload, onReset }: ThreeDViewerProps) {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
        <div className="text-center text-zinc-400">
          <Globe className="w-16 h-16 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-sm">3D Viewer</p>
          <p className="text-xs mt-1 text-zinc-500">
            Model ready for download
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onDownload}
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          Download 3D Model
        </Button>

        <Button
          variant="secondary"
          onClick={onReset}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Create New
        </Button>
      </div>
    </div>
  )
}
