import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useApiError } from '@/composables/useApiError'

// ─── Delete Dialog ──────────────────────────────────────────────────

interface DeleteTarget {
  id: string
  name: string
}

interface UseDeleteDialogOptions {
  /** Async function to call the DELETE API */
  deleteFn: (id: string) => Promise<void>
  /** Query keys to invalidate after successful delete */
  invalidateKeys: string[][]
}

export function useDeleteDialog(options: UseDeleteDialogOptions) {
  const { t } = useI18n()
  const message = useMessage()
  const queryClient = useQueryClient()
  const { handleError } = useApiError()

  const showDialog = ref(false)
  const target = ref<DeleteTarget | null>(null)

  const mutation = useMutation({
    mutationFn: (id: string) => options.deleteFn(id),
    onSuccess: () => {
      message.success(t('common.deleteSuccess'))
      showDialog.value = false
      target.value = null
      for (const key of options.invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key })
      }
    },
    onError: handleError,
  })

  function open(item: DeleteTarget) {
    target.value = item
    showDialog.value = true
  }

  function confirm() {
    if (target.value) {
      mutation.mutate(target.value.id)
    }
  }

  return {
    showDialog,
    target,
    mutation,
    open,
    confirm,
  }
}

// ─── Toggle Active ──────────────────────────────────────────────────

interface UseToggleActiveOptions {
  /** Async function to call the toggle API */
  toggleFn: (id: string, isActive: boolean) => Promise<unknown>
  /** Query keys to invalidate after successful toggle */
  invalidateKeys: string[][]
}

export function useToggleActive(options: UseToggleActiveOptions) {
  const { t } = useI18n()
  const message = useMessage()
  const queryClient = useQueryClient()
  const { handleError } = useApiError()

  const mutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      options.toggleFn(id, isActive),
    onSuccess: () => {
      for (const key of options.invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key })
      }
      message.success(t('common.statusUpdated'))
    },
    onError: handleError,
  })

  return { mutation }
}

// ─── Client-side Search + Pagination ────────────────────────────────

export function useSearchPagination<T>(
  items: Ref<T[]> | ComputedRef<T[]>,
  searchFields: (item: T) => string[],
) {
  const search = ref('')
  const currentPage = ref(1)
  const pageSize = ref(20)

  const filtered = computed(() => {
    const list = unref(items)
    if (!search.value.trim()) return list
    const q = search.value.toLowerCase()
    return list.filter((item) =>
      searchFields(item).some((field) => field.toLowerCase().includes(q)),
    )
  })

  const totalItems = computed(() => filtered.value.length)

  const paginated = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filtered.value.slice(start, start + pageSize.value)
  })

  // Reset page on search change
  watch(search, () => {
    currentPage.value = 1
  })

  return {
    search,
    currentPage,
    pageSize,
    filtered,
    paginated,
    totalItems,
  }
}
