'use client'

import { useState, useRef, useCallback } from 'react'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedBlob: Blob) => void
  onCancel: () => void
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [isProcessing, setIsProcessing] = useState(false)

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const cropSize = Math.min(width, height)

    const initialCrop = centerCrop(
      makeAspectCrop({ unit: 'px', width: cropSize }, 1, width, height),
      width,
      height
    )
    setCrop(initialCrop)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!imgRef.current || !crop) return

    setIsProcessing(true)

    try {
      const canvas = document.createElement('canvas')
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height

      canvas.width = crop.width * scaleX
      canvas.height = crop.height * scaleY

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      ctx.drawImage(
        imgRef.current,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      )

      canvas.toBlob(
        (blob) => {
          setIsProcessing(false)
          if (blob) {
            onCropComplete(blob)
          }
        },
        'image/png',
        1
      )
    } catch {
      setIsProcessing(false)
    }
  }, [crop, onCropComplete])

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Drag to adjust the crop area. Only the square region will be processed for optimal 3D
        results.
      </p>

      <div className="flex justify-center">
        <ReactCrop
          crop={crop}
          onChange={setCrop}
          aspect={1}
          className="max-h-[400px]"
          disabled={isProcessing}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop preview"
            onLoad={onImageLoad}
            className="max-h-[400px]"
          />
        </ReactCrop>
      </div>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button onClick={handleConfirm} className="flex-1" disabled={isProcessing || !crop}>
          {isProcessing ? 'Processing...' : 'Confirm Crop'}
        </Button>
      </div>
    </div>
  )
}
