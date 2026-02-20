<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { SettingsOutline, DownloadOutline, ImageOutline, AddOutline, RemoveOutline, RefreshOutline } from '@vicons/ionicons5'

const { t } = useI18n()

const props = defineProps<{
  url: string
  originalImage?: string
  downloadUrl?: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const autoRotate = ref(true)
const wireframe = ref(false)
const triangleCount = ref(0)
const showSettings = ref(false)
const showOriginal = ref(false)
const isLoading = ref(true)

function toggleSettings() {
  showSettings.value = !showSettings.value
}

function toggleOriginal() {
  showOriginal.value = !showOriginal.value
}

// Three.js state (non-reactive, managed imperatively)
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let model: THREE.Group | null = null
let animationId: number | null = null
let wireframeOverlays: THREE.LineSegments[] = []

function applyWireframe(obj: THREE.Object3D, enabled: boolean) {
  // Remove existing overlays
  for (const overlay of wireframeOverlays) {
    overlay.parent?.remove(overlay)
    overlay.geometry.dispose()
    ;(overlay.material as THREE.Material).dispose()
  }
  wireframeOverlays = []

  if (!enabled) return

  // Add wireframe overlay on each mesh
  obj.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const edges = new THREE.EdgesGeometry(child.geometry, 15)
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.6 }),
    )
    child.add(line)
    wireframeOverlays.push(line)
  })
}

function countTriangles(obj: THREE.Object3D): number {
  let count = 0
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geo = child.geometry
      if (geo.index) {
        count += geo.index.count / 3
      } else if (geo.attributes.position) {
        count += geo.attributes.position.count / 3
      }
    }
  })
  return Math.floor(count)
}

function fitCameraToModel(obj: THREE.Object3D) {
  if (!camera || !controls) return

  const box = new THREE.Box3().setFromObject(obj)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  const fov = camera.fov * (Math.PI / 180)
  const distance = maxDim / (2 * Math.tan(fov / 2)) * 1.5

  camera.position.set(center.x + distance * 0.5, center.y + distance * 0.5, center.z + distance)
  camera.lookAt(center)
  controls.target.copy(center)
  controls.update()
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
  camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.01, 1000)
  camera.position.set(0, 5, 20)
  camera.lookAt(0, 0, 0)

  // Controls
  controls = new OrbitControls(camera, canvas)
  controls.enablePan = true
  controls.enableZoom = true
  controls.enableRotate = true
  controls.minDistance = 0.5
  controls.maxDistance = 200

  // Lights — ambient + directional for mesh surfaces
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(5, 10, 7)
  scene.add(dirLight)

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

  // Load GLB model
  const loader = new GLTFLoader()
  loader.load(
    props.url,
    (gltf) => {
      model = gltf.scene
      scene!.add(model)

      // Place model bottom on the grid (y=0)
      const box = new THREE.Box3().setFromObject(model)
      model.position.y -= box.min.y

      triangleCount.value = countTriangles(model)
      fitCameraToModel(model)
      applyWireframe(model, wireframe.value)
      isLoading.value = false
    },
    undefined,
    (error) => {
      console.error('Failed to load GLB model:', error)
      isLoading.value = false
    },
  )

  // Animation loop
  function animate() {
    animationId = requestAnimationFrame(animate)

    if (autoRotate.value && model) {
      model.rotation.y += 0.003
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

function handleZoom(factor: number) {
  if (!camera || !controls) return
  const direction = new THREE.Vector3()
  camera.getWorldDirection(direction)
  camera.position.addScaledVector(direction, factor)
  controls.update()
}

function handleResetView() {
  if (!model) return
  fitCameraToModel(model)
}

function handleDownload() {
  const url = props.downloadUrl ?? props.url
  const a = document.createElement('a')
  a.href = url
  a.download = `model_${Date.now()}.glb`
  a.click()
}

function cleanupThree() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  // Dispose wireframe overlays
  for (const overlay of wireframeOverlays) {
    overlay.geometry.dispose()
    ;(overlay.material as THREE.Material).dispose()
  }
  wireframeOverlays = []
  if (model) {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        for (const mat of materials) {
          mat.dispose()
          // Dispose textures
          if ('map' in mat && mat.map) mat.map.dispose()
          if ('normalMap' in mat && mat.normalMap) mat.normalMap.dispose()
          if ('roughnessMap' in mat && mat.roughnessMap) mat.roughnessMap.dispose()
          if ('metalnessMap' in mat && mat.metalnessMap) mat.metalnessMap.dispose()
          if ('emissiveMap' in mat && mat.emissiveMap) mat.emissiveMap.dispose()
          if ('aoMap' in mat && mat.aoMap) mat.aoMap.dispose()
        }
      }
    })
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
  model = null
  renderer = null
}

// Resize canvas when settings panel toggles
watch(showSettings, () => {
  nextTick(() => handleResize())
})

// Watch wireframe toggle
watch(wireframe, (enabled) => {
  if (model) {
    applyWireframe(model, enabled)
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
        <!-- Loading overlay -->
        <div v-if="isLoading" class="absolute inset-0 rounded-lg bg-zinc-900 flex items-center justify-center">
          <div class="text-center text-muted-foreground">
            <div class="animate-spin w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full mx-auto mb-2" />
            <p class="text-sm">{{ t('tools.modelViewer.loadingModel') }}</p>
          </div>
        </div>
        <!-- Top-right icon buttons -->
        <div class="absolute top-3 right-3 flex items-center gap-2">
          <button
            class="flex items-center justify-center w-8 h-8 rounded-md bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer border-0"
            title="Zoom in"
            @click="handleZoom(2)"
          >
            <n-icon :size="18">
              <AddOutline />
            </n-icon>
          </button>
          <button
            class="flex items-center justify-center w-8 h-8 rounded-md bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer border-0"
            title="Zoom out"
            @click="handleZoom(-2)"
          >
            <n-icon :size="18">
              <RemoveOutline />
            </n-icon>
          </button>
          <button
            class="flex items-center justify-center w-8 h-8 rounded-md bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer border-0"
            title="Reset view"
            @click="handleResetView"
          >
            <n-icon :size="18">
              <RefreshOutline />
            </n-icon>
          </button>
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
            :title="t('tools.modelViewer.settings')"
            @click="toggleSettings"
          >
            <n-icon :size="18">
              <SettingsOutline />
            </n-icon>
          </button>
        </div>
        <!-- Triangle count overlay -->
        <div v-if="!isLoading" class="absolute bottom-3 left-3 text-xs text-zinc-400 bg-zinc-800/80 px-2 py-1 rounded">
          {{ t('tools.modelViewer.triangles') }}: {{ triangleCount.toLocaleString() }}
        </div>
      </div>

      <!-- Right: Settings Panel -->
      <div v-if="showSettings" class="lg:w-72 shrink-0 rounded-lg bg-muted p-4 space-y-5">
        <h4 class="text-sm font-semibold text-foreground">{{ t('tools.modelViewer.settings') }}</h4>

        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="autoRotate" type="checkbox" class="rounded" />
          <span class="text-sm text-foreground">{{ t('tools.modelViewer.autoRotate') }}</span>
        </label>

        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="wireframe" type="checkbox" class="rounded" />
          <span class="text-sm text-foreground">{{ t('tools.modelViewer.wireframe') }}</span>
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
      <n-button type="primary" class="flex-1" @click="handleDownload">
        <template #icon>
          <n-icon><DownloadOutline /></n-icon>
        </template>
        {{ t('tools.modelViewer.downloadGLB') }}
      </n-button>
    </div>
  </div>
</template>
