<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { SettingsOutline, DownloadOutline, ImageOutline, ChevronDownOutline } from '@vicons/ionicons5'
import type { DropdownOption } from 'naive-ui'

const { t } = useI18n()

interface PointCloudData {
  txt: string
  conf: number[]
}

const props = defineProps<{
  data: PointCloudData
  originalImage?: string
  showExport?: boolean
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const pointSize = ref(0.08)
const autoRotate = ref(true)
const confThreshold = ref(0)
const zCropEnabled = ref(true)
const pointCount = ref(0)
const showSettings = ref(false)
const showOriginal = ref(false)

function toggleSettings() {
  showSettings.value = !showSettings.value
}

function toggleOriginal() {
  showOriginal.value = !showOriginal.value
}

const hasConfidence = computed(() => props.data.conf && props.data.conf.length > 0)

// Three.js state (non-reactive, managed imperatively)
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let points: THREE.Points | null = null
let animationId: number | null = null

function parsePointCloudData(data: PointCloudData, threshold: number, zCrop: boolean) {
  const lines = data.txt.split('\n').filter(Boolean)
  const confidenceArray = data.conf || []

  const filteredIndices: number[] = []
  for (let i = 0; i < lines.length; i++) {
    const conf = confidenceArray[i] ?? 1
    if (conf >= threshold) {
      filteredIndices.push(i)
    }
  }

  const count = filteredIndices.length
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  let validCount = 0
  for (const originalIndex of filteredIndices) {
    const line = lines[originalIndex]
    const parts = line.split(',')

    if (parts.length >= 7) {
      const x = parseFloat(parts[1])
      const y = parseFloat(parts[2])
      const z = parseFloat(parts[3])
      const r = parseInt(parts[4], 10)
      const g = parseInt(parts[5], 10)
      const b = parseInt(parts[6], 10)

      if (isNaN(x) || isNaN(y) || isNaN(z)) continue
      if (zCrop && z > 0) continue

      positions[validCount * 3] = x
      positions[validCount * 3 + 1] = y
      positions[validCount * 3 + 2] = z

      colors[validCount * 3] = Math.max(0, Math.min(255, isNaN(r) ? 0 : r)) / 255
      colors[validCount * 3 + 1] = Math.max(0, Math.min(255, isNaN(g) ? 0 : g)) / 255
      colors[validCount * 3 + 2] = Math.max(0, Math.min(255, isNaN(b) ? 0 : b)) / 255

      validCount++
    }
  }

  return {
    positions: positions.subarray(0, validCount * 3),
    colors: colors.subarray(0, validCount * 3),
    pointCount: validCount,
  }
}

function buildPointCloud() {
  if (!scene) return

  // Remove old points
  if (points) {
    scene.remove(points)
    points.geometry.dispose()
    ;(points.material as THREE.PointsMaterial).dispose()
    points = null
  }

  const result = parsePointCloudData(props.data, confThreshold.value, zCropEnabled.value)
  pointCount.value = result.pointCount

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(result.positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(result.colors, 3))

  const material = new THREE.PointsMaterial({
    size: pointSize.value,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
  })

  points = new THREE.Points(geometry, material)
  scene.add(points)
}

function initThree() {
  const canvas = canvasRef.value
  if (!canvas) return

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0x18181b) // zinc-900

  const rect = canvas.parentElement!.getBoundingClientRect()
  renderer.setSize(rect.width, rect.height)

  // Scene
  scene = new THREE.Scene()

  // Camera
  camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.1, 1000)
  camera.position.set(0, 5, -20)
  camera.lookAt(0, 0, 0)

  // Controls
  controls = new OrbitControls(camera, canvas)
  controls.enablePan = true
  controls.enableZoom = true
  controls.enableRotate = true
  controls.minDistance = 5
  controls.maxDistance = 100

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.5))
  const pointLight = new THREE.PointLight(0xffffff, 1)
  pointLight.position.set(10, 10, 10)
  scene.add(pointLight)

  // Grid + Axes
  scene.add(new THREE.GridHelper(20, 20, 0x444444, 0x222222))
  scene.add(new THREE.AxesHelper(5))

  // Axis labels
  const axisLabels = [
    { text: 'X', color: '#ff4444', position: new THREE.Vector3(5.5, 0, 0) },
    { text: 'Y', color: '#44ff44', position: new THREE.Vector3(0, 5.5, 0) },
    { text: 'Z', color: '#4488ff', position: new THREE.Vector3(0, 0, 5.5) },
  ]
  for (const { text, color, position } of axisLabels) {
    const canvas2d = document.createElement('canvas')
    canvas2d.width = 64
    canvas2d.height = 64
    const ctx = canvas2d.getContext('2d')!
    ctx.fillStyle = color
    ctx.font = 'bold 48px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 32, 32)

    const texture = new THREE.CanvasTexture(canvas2d)
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.position.copy(position)
    sprite.scale.set(1, 1, 1)
    scene.add(sprite)
  }

  // Build point cloud
  buildPointCloud()

  // Animation loop
  function animate() {
    animationId = requestAnimationFrame(animate)

    if (autoRotate.value && points) {
      points.rotation.y += 0.003
    }

    controls!.update()
    renderer!.render(scene!, camera!)
  }
  animate()
}

function handleResize() {
  if (!renderer || !camera || !canvasRef.value) return
  const rect = canvasRef.value.parentElement!.getBoundingClientRect()
  renderer.setSize(rect.width, rect.height)
  camera.aspect = rect.width / rect.height
  camera.updateProjectionMatrix()
}

function getFilteredLines(): string[] {
  const lines = props.data.txt.split('\n').filter(Boolean)
  const confidenceArray = props.data.conf || []

  const filteredLines: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const conf = confidenceArray[i] ?? 1
    if (conf < confThreshold.value) continue

    const parts = lines[i].split(',')
    if (parts.length >= 7) {
      const z = parseFloat(parts[3])
      if (isNaN(z)) continue
      if (zCropEnabled.value && z > 0) continue
      filteredLines.push(lines[i])
    }
  }
  return filteredLines
}

function handleDownloadPLY() {
  const filteredLines = getFilteredLines()

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
}

function handleDownloadTXT() {
  const filteredLines = getFilteredLines()
  const blob = new Blob([filteredLines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `point_cloud_${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

const downloadOptions = computed<DropdownOption[]>(() => [
  { label: 'TXT', key: 'txt' },
  { label: 'PLY', key: 'ply' },
])

function handleDownloadSelect(key: string) {
  if (key === 'ply') handleDownloadPLY()
  else if (key === 'txt') handleDownloadTXT()
}

function cleanupThree() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (points) {
    points.geometry.dispose()
    ;(points.material as THREE.PointsMaterial).dispose()
  }
  if (controls) {
    controls.dispose()
  }
  if (renderer) {
    renderer.dispose()
  }
  scene = null
  camera = null
  controls = null
  points = null
  renderer = null
}

// Resize canvas when settings panel toggles
watch(showSettings, () => {
  nextTick(() => handleResize())
})

// Watch for filter/size changes — rebuild point cloud
watch([confThreshold, zCropEnabled], () => {
  buildPointCloud()
})

watch(pointSize, (newSize) => {
  if (points) {
    ;(points.material as THREE.PointsMaterial).size = newSize
  }
})

onMounted(() => {
  initThree()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cleanupThree()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Main layout: Canvas + Settings side by side -->
    <div class="flex flex-col lg:flex-row gap-4">
      <!-- Left: 3D Canvas (auto-resizes) -->
      <div class="flex-1 relative min-w-0">
        <div class="rounded-lg overflow-hidden bg-zinc-900" style="min-height: 500px">
          <canvas ref="canvasRef" class="w-full h-full block" style="height: 500px" />
        </div>
        <!-- Top-right icon buttons -->
        <div class="absolute top-3 right-3 flex items-center gap-2">
          <button
            v-if="originalImage"
            class="flex items-center justify-center w-8 h-8 rounded-md text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer border-0"
            :class="showOriginal ? 'bg-primary/80 text-white' : 'bg-zinc-800/80'"
            :title="t('tools.original')"
            @click="toggleOriginal"
          >
            <n-icon :size="18">
              <ImageOutline />
            </n-icon>
          </button>
          <button
            class="flex items-center justify-center w-8 h-8 rounded-md text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer border-0"
            :class="showSettings ? 'bg-primary/80 text-white' : 'bg-zinc-800/80'"
            :title="t('tools.pointCloud.settings')"
            @click="toggleSettings"
          >
            <n-icon :size="18">
              <SettingsOutline />
            </n-icon>
          </button>
        </div>
        <!-- Point count overlay -->
        <div class="absolute bottom-3 left-3 text-xs text-zinc-400 bg-zinc-800/80 px-2 py-1 rounded">
          {{ t('tools.pointCloud.points') }}: {{ pointCount.toLocaleString() }}
        </div>
      </div>

      <!-- Right: Settings Panel -->
      <div v-if="showSettings" class="lg:w-72 shrink-0 rounded-lg bg-muted p-4 space-y-5">
        <h4 class="text-sm font-semibold text-foreground">{{ t('tools.pointCloud.settings') }}</h4>

        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="autoRotate" type="checkbox" class="rounded" />
          <span class="text-sm text-foreground">{{ t('tools.pointCloud.autoRotate') }}</span>
        </label>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm text-muted-foreground">{{ t('tools.pointCloud.pointSize') }}</label>
            <span class="text-sm text-muted-foreground tabular-nums">{{ pointSize.toFixed(2) }}</span>
          </div>
          <input v-model.number="pointSize" type="range" min="0.01" max="0.3" step="0.01" class="w-full" />
        </div>

        <div v-if="hasConfidence" class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm text-muted-foreground">{{ t('tools.pointCloud.confidence') }}</label>
            <span class="text-sm text-muted-foreground tabular-nums">{{ (confThreshold * 100).toFixed(0) }}%</span>
          </div>
          <input v-model.number="confThreshold" type="range" min="0" max="1" step="0.05" class="w-full" />
        </div>

        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="zCropEnabled" type="checkbox" class="rounded" />
          <span class="text-sm text-foreground">{{ t('tools.pointCloud.zCrop') }}</span>
        </label>
      </div>
    </div>

    <!-- Original Image Dialog -->
    <n-modal v-model:show="showOriginal">
      <div class="rounded-lg overflow-hidden bg-card p-2 max-w-2xl">
        <img v-if="originalImage" :src="originalImage" :alt="t('tools.original')" class="w-full object-contain rounded" />
      </div>
    </n-modal>

    <!-- Actions -->
    <div class="flex gap-3">
      <div class="flex flex-1">
        <n-button type="primary" class="flex-1 !rounded-r-none" @click="handleDownloadTXT">
          <template #icon>
            <n-icon><DownloadOutline /></n-icon>
          </template>
          {{ t('tools.download') }}
        </n-button>
        <n-dropdown :options="downloadOptions" @select="handleDownloadSelect" placement="bottom-end">
          <n-button type="primary" class="!rounded-l-none !border-l !border-l-white/20 !px-2">
            <n-icon :size="16"><ChevronDownOutline /></n-icon>
          </n-button>
        </n-dropdown>
      </div>
      <n-button v-if="showExport" type="primary" class="flex-1" @click="handleDownloadTXT">
        Export
      </n-button>
    </div>
  </div>
</template>
