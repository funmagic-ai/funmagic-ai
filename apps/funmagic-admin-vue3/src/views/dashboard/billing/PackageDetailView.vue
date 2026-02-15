<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NInputNumber, NIcon, NSwitch, NSelect, NSpin } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import { validateForm } from '@/composables/useFormValidation'
import { useApiError } from '@/composables/useApiError'
import PageHeader from '@/components/shared/PageHeader.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const message = useMessage()
const { handleError } = useApiError()
const queryClient = useQueryClient()

const id = computed(() => route.params.id as string)

const formRef = ref<FormInst | null>(null)
const formValue = ref({
  name: '',
  description: '',
  credits: 100,
  bonusCredits: 0,
  price: 9.99,
  currency: 'usd',
  isPopular: false,
  isActive: true,
  sortOrder: 0,
})

const rules: FormRules = {
  name: [{ required: true, message: t('validation.nameRequired'), trigger: 'blur' }],
  credits: [{ required: true, type: 'number', message: t('validation.creditsRequired'), trigger: 'blur' }],
  price: [{ required: true, type: 'number', message: t('validation.priceRequired'), trigger: 'blur' }],
}

const currencyOptions = [
  { label: t('billing.currencies.usd'), value: 'usd' },
  { label: t('billing.currencies.eur'), value: 'eur' },
  { label: t('billing.currencies.gbp'), value: 'gbp' },
  { label: t('billing.currencies.cny'), value: 'cny' },
  { label: t('billing.currencies.jpy'), value: 'jpy' },
]

const { isLoading, isError, error } = useQuery({
  queryKey: ['packages', id],
  queryFn: async () => {
    const { data, error, response } = await api.GET('/api/admin/packages/{id}', {
      params: { path: { id: id.value } },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  select: (data) => {
    const pkg = data.package
    formValue.value = {
      name: pkg.name,
      description: pkg.description ?? '',
      credits: pkg.credits,
      bonusCredits: pkg.bonusCredits,
      price: parseFloat(pkg.price),
      currency: pkg.currency,
      isPopular: pkg.isPopular,
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder,
    }
    return pkg
  },
})

const updateMutation = useMutation({
  mutationFn: async () => {
    const { data, error, response } = await api.PUT('/api/admin/packages/{id}', {
      params: { path: { id: id.value } },
      body: {
        name: formValue.value.name,
        description: formValue.value.description || undefined,
        credits: formValue.value.credits,
        bonusCredits: formValue.value.bonusCredits,
        price: formValue.value.price,
        currency: formValue.value.currency,
        isPopular: formValue.value.isPopular,
        isActive: formValue.value.isActive,
        sortOrder: formValue.value.sortOrder,
      },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['packages'] })
    message.success(t('common.updateSuccess'))
    router.push({ name: 'packages' })
  },
  onError: handleError,
})

async function handleSubmit() {
  if (!await validateForm(formRef)) return
  updateMutation.mutate()
}
</script>

<template>
  <div>
    <PageHeader :title="t('billing.editPackage')">
      <template #actions>
        <NButton @click="router.push({ name: 'packages' })">
          <template #icon>
            <NIcon><ArrowBackOutline /></NIcon>
          </template>
          {{ t('common.back') }}
        </NButton>
      </template>
    </PageHeader>

    <div class="rounded-xl border bg-card py-6 shadow-sm">
      <div class="px-6">
      <div v-if="isLoading" class="flex justify-center py-12">
        <NSpin size="large" />
      </div>

      <div v-else-if="isError" class="py-8 text-center text-destructive">
        {{ (error as Error)?.message || t('common.error') }}
      </div>

      <template v-else>
        <NForm
          ref="formRef"
          :model="formValue"
          :rules="rules"
          label-placement="left"
          label-width="140"
        >
          <div class="grid grid-cols-2 gap-4">
            <NFormItem :label="t('common.active')">
              <NSwitch v-model:value="formValue.isActive" />
            </NFormItem>

            <NFormItem :label="t('common.popular')">
              <NSwitch v-model:value="formValue.isPopular" />
            </NFormItem>
          </div>

          <NFormItem :label="t('common.name')" path="name">
            <NInput v-model:value="formValue.name" :placeholder="t('placeholder.examplePackageName')" />
          </NFormItem>

          <NFormItem :label="t('common.description')">
            <NInput
              v-model:value="formValue.description"
              type="textarea"
              :rows="3"
              :placeholder="t('placeholder.optionalDescription')"
            />
          </NFormItem>

          <NFormItem :label="t('billing.credits')" path="credits">
            <NInputNumber v-model:value="formValue.credits" :min="1" class="w-full" />
          </NFormItem>

          <NFormItem :label="t('billing.bonusCredits')">
            <NInputNumber v-model:value="formValue.bonusCredits" :min="0" class="w-full" />
          </NFormItem>

          <NFormItem :label="t('billing.price')" path="price">
            <NInputNumber v-model:value="formValue.price" :min="0" :precision="2" class="w-full" />
          </NFormItem>

          <NFormItem :label="t('billing.currency')">
            <NSelect v-model:value="formValue.currency" :options="currencyOptions" />
          </NFormItem>

          <NFormItem :label="t('common.sortOrder')">
            <NInputNumber v-model:value="formValue.sortOrder" :min="0" class="w-full" />
          </NFormItem>

          <div class="flex justify-end gap-2 pt-4">
            <NButton @click="router.back()">
              {{ t('common.cancel') }}
            </NButton>
            <NButton
              type="primary"
              :loading="updateMutation.isPending.value"
              @click="handleSubmit"
            >
              {{ t('common.save') }}
            </NButton>
          </div>
        </NForm>
      </template>
      </div>
    </div>

  </div>
</template>
