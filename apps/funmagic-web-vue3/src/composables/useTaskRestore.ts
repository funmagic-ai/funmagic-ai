import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/lib/api'

export function useTaskRestore(expectedToolSlug: string) {
  const route = useRoute()
  const restoreTaskId = computed(() => (route.query.taskId as string) || null)
  const isRestoring = ref(false)
  const sourceImageUrl = ref<string | null>(null)

  async function fetchRestoreData() {
    if (!restoreTaskId.value) return null
    isRestoring.value = true
    try {
      const { data } = await api.GET('/api/tasks/{taskId}', {
        params: { path: { taskId: restoreTaskId.value } },
      })
      if (!data?.task) return null
      if (data.task.toolSlug !== expectedToolSlug) return null
      return data
    } finally {
      isRestoring.value = false
    }
  }

  async function fetchSourceImage(assetId: string) {
    const { data } = await api.GET('/api/assets/{id}/url', {
      params: { path: { id: assetId } },
    })
    sourceImageUrl.value = data?.url ?? null
  }

  return { restoreTaskId, isRestoring, sourceImageUrl, fetchRestoreData, fetchSourceImage }
}
