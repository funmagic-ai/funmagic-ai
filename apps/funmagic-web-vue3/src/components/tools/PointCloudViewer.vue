<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { SettingsOutline, DownloadOutline } from '@vicons/ionicons5'
import type { DropdownOption } from 'naive-ui'

const { t } = useI18n()

interface PointCloudData {
  txt: string
  conf: number[]
}

const props = defineProps<{
  data: PointCloudData
}>()

const emit = defineEmits<{
  reset: []
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const pointSize = ref(0.08)
const autoRotate = ref(true)
const confThreshold = ref(0)
const zCropEnabled = ref(true)
const pointCount = ref(0)
const showSettings = ref(true)

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
  camera.position.set(0, 5, 20)
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
  { label: 'PLY', key: 'ply' },
  { label: 'TXT', key: 'txt' },
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
      <!-- Left: 3D Canvas -->
      <div class="flex-1 relative">
        <div class="rounded-lg overflow-hidden bg-zinc-900" style="min-height: 500px">
          <canvas ref="canvasRef" class="w-full h-full block" style="height: 500px" />
        </div>
        <!-- Settings toggle button -->
        <button
          class="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-md bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer border-0"
          :title="showSettings ? 'Hide settings' : 'Show settings'"
          @click="showSettings = !showSettings"
        >
          <n-icon :size="18">
            <SettingsOutline />
          </n-icon>
        </button>
        <!-- Point count overlay -->
        <div class="absolute bottom-3 left-3 text-xs text-zinc-400 bg-zinc-800/80 px-2 py-1 rounded">
          {{ t('tools.pointCloud.points') }}: {{ pointCount.toLocaleString() }}
        </div>
      </div>

      <!-- Right: Settings Panel -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 lg:w-0 lg:opacity-0"
        enter-to-class="opacity-100 lg:w-72 lg:opacity-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 lg:w-72 lg:opacity-100"
        leave-to-class="opacity-0 lg:w-0 lg:opacity-0"
      >
        <div
          v-if="showSettings"
          class="lg:w-72 shrink-0 rounded-lg bg-muted p-4 space-y-5"
        >
          <h4 class="text-sm font-semibold text-foreground">{{ t('tools.pointCloud.settings') }}</h4>

          <!-- Auto-rotate -->
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="autoRotate"
              type="checkbox"
              class="rounded"
            />
            <span class="text-sm text-foreground">{{ t('tools.pointCloud.autoRotate') }}</span>
          </label>

          <!-- Point Size -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm text-muted-foreground">{{ t('tools.pointCloud.pointSize') }}</label>
              <span class="text-sm text-muted-foreground tabular-nums">{{ pointSize.toFixed(2) }}</span>
            </div>
            <input
              v-model.number="pointSize"
              type="range"
              min="0.01"
              max="0.3"
              step="0.01"
              class="w-full"
            />
          </div>

          <!-- Confidence Threshold -->
          <div v-if="hasConfidence" class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm text-muted-foreground">{{ t('tools.pointCloud.confidence') }}</label>
              <span class="text-sm text-muted-foreground tabular-nums">{{ (confThreshold * 100).toFixed(0) }}%</span>
            </div>
            <input
              v-model.number="confThreshold"
              type="range"
              min="0"
              max="1"
              step="0.05"
              class="w-full"
            />
          </div>

          <!-- Z-Axis Crop -->
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="zCropEnabled"
              type="checkbox"
              class="rounded"
            />
            <span class="text-sm text-foreground">{{ t('tools.pointCloud.zCrop') }}</span>
          </label>
        </div>
      </Transition>
    </div>

    <!-- Actions -->
    <div class="flex flex-wrap gap-3">
      <n-dropdown :options="downloadOptions" @select="handleDownloadSelect">
        <n-button type="primary">
          <template #icon>
            <n-icon><DownloadOutline /></n-icon>
          </template>
          {{ t('tools.download') }}
        </n-button>
      </n-dropdown>
      <n-button @click="emit('reset')">
        {{ t('tools.processAnother') }}
      </n-button>
    </div>
  </div>
</template>
