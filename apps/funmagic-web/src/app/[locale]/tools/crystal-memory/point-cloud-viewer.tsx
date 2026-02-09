'use client'

import { useMemo, useRef, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw } from 'lucide-react'

interface PointCloudData {
  txt: string
  conf: number[]
}

interface PointCloudViewerProps {
  data: PointCloudData
  onDownload?: () => void
  onReset?: () => void
  confidenceThreshold?: number
}

interface PointCloudMeshProps {
  positions: Float32Array
  colors: Float32Array
  pointCount: number
  pointSize: number
  autoRotate: boolean
}

function PointCloudMesh({ positions, colors, pointCount, pointSize, autoRotate }: PointCloudMeshProps) {
  const meshRef = useRef<THREE.Points>(null)

  useFrame((_, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2
    }
  })

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [positions, colors])

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
    })
  }, [pointSize])

  return <points ref={meshRef} geometry={geometry} material={material} />
}

function CameraController() {
  const { camera } = useThree()

  useMemo(() => {
    camera.position.set(0, 5, 20)
    camera.lookAt(0, 0, 0)
  }, [camera])

  return null
}

function parsePointCloudData(
  data: PointCloudData,
  confidenceThreshold: number,
  zCropEnabled: boolean
): {
  positions: Float32Array
  colors: Float32Array
  pointCount: number
} {
  const lines = data.txt.split('\n').filter(Boolean)
  const confidenceArray = data.conf || []

  // Filter by confidence if available
  const filteredIndices: number[] = []
  for (let i = 0; i < lines.length; i++) {
    const conf = confidenceArray[i] ?? 1
    if (conf >= confidenceThreshold) {
      filteredIndices.push(i)
    }
  }

  const pointCount = filteredIndices.length
  const positions = new Float32Array(pointCount * 3)
  const colors = new Float32Array(pointCount * 3)

  let validCount = 0
  filteredIndices.forEach((originalIndex) => {
    const line = lines[originalIndex]
    const parts = line.split(',')

    if (parts.length >= 7) {
      const x = parseFloat(parts[1])
      const y = parseFloat(parts[2])
      const z = parseFloat(parts[3])
      const r = parseInt(parts[4], 10)
      const g = parseInt(parts[5], 10)
      const b = parseInt(parts[6], 10)

      // Skip points with invalid (NaN) coordinates
      if (isNaN(x) || isNaN(y) || isNaN(z)) return

      // Apply Z-axis crop filter (remove points behind XY plane)
      if (zCropEnabled && z < 0) return

      positions[validCount * 3] = x
      positions[validCount * 3 + 1] = y
      positions[validCount * 3 + 2] = z

      // Clamp RGB values to valid range [0, 255] and normalize
      colors[validCount * 3] = Math.max(0, Math.min(255, isNaN(r) ? 0 : r)) / 255
      colors[validCount * 3 + 1] = Math.max(0, Math.min(255, isNaN(g) ? 0 : g)) / 255
      colors[validCount * 3 + 2] = Math.max(0, Math.min(255, isNaN(b) ? 0 : b)) / 255

      validCount++
    }
  })

  // Return the actual valid count (may be less than filteredIndices.length due to NaN filtering)
  return { positions, colors, pointCount: validCount }
}

export function PointCloudViewer({
  data,
  onDownload,
  onReset,
  confidenceThreshold = 0,
}: PointCloudViewerProps) {
  const [pointSize, setPointSize] = useState(0.08)
  const [autoRotate, setAutoRotate] = useState(true)
  const [confThreshold, setConfThreshold] = useState(confidenceThreshold)
  const [zCropEnabled, setZCropEnabled] = useState(true)

  const { positions, colors, pointCount } = useMemo(
    () => parsePointCloudData(data, confThreshold, zCropEnabled),
    [data, confThreshold, zCropEnabled]
  )

  const handleDownloadPLY = useCallback(() => {
    const lines = data.txt.split('\n').filter(Boolean)
    const confidenceArray = data.conf || []

    // Filter points based on current settings (confidence + Z-crop)
    const filteredLines: string[] = []
    for (let i = 0; i < lines.length; i++) {
      const conf = confidenceArray[i] ?? 1
      if (conf < confThreshold) continue

      const parts = lines[i].split(',')
      if (parts.length >= 7) {
        const z = parseFloat(parts[3])
        if (isNaN(z)) continue

        // Apply Z-crop filter if enabled (remove points behind XY plane)
        if (zCropEnabled && z < 0) continue

        filteredLines.push(lines[i])
      }
    }

    // Generate PLY format
    const plyHeader = [
      'ply',
      'format ascii 1.0',
      `element vertex ${filteredLines.length}`,
      'property float x',
      'property float y',
      'property float z',
      'property uchar red',
      'property uchar green',
      'property uchar blue',
      'end_header',
    ].join('\n')

    const plyData = filteredLines
      .map((line) => {
        const [, x, y, z, r, g, b] = line.split(',')
        return `${x} ${y} ${z} ${r} ${g} ${b}`
      })
      .join('\n')

    const blob = new Blob([plyHeader + '\n' + plyData], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `point_cloud_${Date.now()}.ply`
    a.click()
    URL.revokeObjectURL(url)
  }, [data, confThreshold, zCropEnabled])

  const hasConfidence = data.conf && data.conf.length > 0

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 rounded-lg overflow-hidden" style={{ height: '500px' }}>
        <Canvas>
          <CameraController />
          <PerspectiveCamera makeDefault position={[0, 5, 20]} fov={50} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />

          <PointCloudMesh
            positions={positions}
            colors={colors}
            pointCount={pointCount}
            pointSize={pointSize}
            autoRotate={autoRotate}
          />

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={false}
            minDistance={5}
            maxDistance={100}
          />

          <gridHelper args={[20, 20, 0x444444, 0x222222]} />
          <axesHelper args={[5]} />
        </Canvas>
      </div>

      {/* Controls */}
      <div className="bg-muted rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Points: {pointCount.toLocaleString()}</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
              className="rounded"
            />
            <span className="text-foreground">Auto-rotate</span>
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">Point Size</label>
            <span className="text-sm text-muted-foreground">{pointSize.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.3"
            step="0.01"
            value={pointSize}
            onChange={(e) => setPointSize(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {hasConfidence && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Confidence Threshold</label>
              <span className="text-sm text-muted-foreground">{(confThreshold * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={confThreshold}
              onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        {/* Z-Axis Crop Controls */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={zCropEnabled}
              onChange={(e) => setZCropEnabled(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-foreground">Z-Axis Crop (Z &lt; 0)</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onDownload || handleDownloadPLY}
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          Download PLY
        </Button>

        {onReset && (
          <Button
            variant="secondary"
            onClick={onReset}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Create New
          </Button>
        )}
      </div>
    </div>
  )
}
