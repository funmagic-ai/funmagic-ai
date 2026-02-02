'use client'

import { useMemo, useRef, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

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

function parsePointCloudData(data: PointCloudData, confidenceThreshold: number): {
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

  filteredIndices.forEach((originalIndex, newIndex) => {
    const line = lines[originalIndex]
    const parts = line.split(',')

    if (parts.length >= 7) {
      const [, x, y, z, r, g, b] = parts.map(Number)

      positions[newIndex * 3] = x
      positions[newIndex * 3 + 1] = y
      positions[newIndex * 3 + 2] = z

      colors[newIndex * 3] = r / 255
      colors[newIndex * 3 + 1] = g / 255
      colors[newIndex * 3 + 2] = b / 255
    }
  })

  return { positions, colors, pointCount }
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

  const { positions, colors, pointCount } = useMemo(
    () => parsePointCloudData(data, confThreshold),
    [data, confThreshold]
  )

  const handleDownloadPLY = useCallback(() => {
    const lines = data.txt.split('\n').filter(Boolean)

    // Generate PLY format
    const plyHeader = [
      'ply',
      'format ascii 1.0',
      `element vertex ${lines.length}`,
      'property float x',
      'property float y',
      'property float z',
      'property uchar red',
      'property uchar green',
      'property uchar blue',
      'end_header',
    ].join('\n')

    const plyData = lines.map(line => {
      const [, x, y, z, r, g, b] = line.split(',')
      return `${x} ${y} ${z} ${r} ${g} ${b}`
    }).join('\n')

    const blob = new Blob([plyHeader + '\n' + plyData], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `point_cloud_${Date.now()}.ply`
    a.click()
    URL.revokeObjectURL(url)
  }, [data])

  const hasConfidence = data.conf && data.conf.length > 0

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-lg overflow-hidden" style={{ height: '500px' }}>
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
      <div className="bg-gray-100 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Points: {pointCount.toLocaleString()}</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
              className="rounded"
            />
            <span className="text-gray-700">Auto-rotate</span>
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Point Size</label>
            <span className="text-sm text-gray-500">{pointSize.toFixed(2)}</span>
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
              <label className="text-sm text-gray-600">Confidence Threshold</label>
              <span className="text-sm text-gray-500">{(confThreshold * 100).toFixed(0)}%</span>
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
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onDownload || handleDownloadPLY}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Download PLY
        </button>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="bg-muted text-foreground px-6 py-3 rounded-lg font-medium hover:bg-accent transition-colors"
          >
            Create New
          </button>
        )}
      </div>
    </div>
  )
}
