'use client'

import { useState } from 'react'

interface BeforeAfterComparisonProps {
  beforeUrl: string
  afterUrl: string
  onDownload: () => void
  onReset: () => void
}

export function BeforeAfterComparison({
  beforeUrl,
  afterUrl,
  onDownload,
  onReset,
}: BeforeAfterComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg bg-[url('/checkered-pattern.svg')] bg-repeat bg-[length:20px_20px]">
        <div className="relative aspect-video max-h-[500px]">
          <img
            src={afterUrl}
            alt="After"
            className="absolute inset-0 w-full h-full object-contain"
          />

          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={beforeUrl}
              alt="Before"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ maxWidth: 'none', width: `${100 / (sliderPosition / 100)}%` }}
            />
          </div>

          <div
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                />
              </svg>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
          />
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex justify-between">
          <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">
            Before
          </span>
          <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">
            After
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onDownload}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Download Result
        </button>

        <button
          type="button"
          onClick={onReset}
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Remove Another
        </button>
      </div>
    </div>
  )
}
