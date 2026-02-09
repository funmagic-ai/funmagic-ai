<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NInputNumber, NIcon, NSwitch, NSelect } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useMutation } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader.vue'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

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

const createMutation = useMutation({
  mutationFn: async () => {
    const { data, error } = await api.POST('/api/admin/packages', {
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
    if (error) throw new Error(error.error ?? 'Failed to create package')
    return data
  },
  onSuccess: () => {
    message.success(t('common.createSuccess'))
    router.push({ name: 'packages' })
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    createMutation.mutate()
  } catch {
    // validation failed
  }
}
</script>

<template>
  <div>
    <PageHeader :title="t('billing.createPackage')">
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
      <NForm
        ref="formRef"
        :model="formValue"
        :rules="rules"
        label-placement="left"
        label-width="140"
      >
        <NFormItem :label="t('common.name')" path="name">
          <NInput v-model:value="formValue.name" placeholder="e.g. Starter Pack" />
        </NFormItem>

        <NFormItem :label="t('common.description')">
          <NInput
            v-model:value="formValue.description"
            type="textarea"
            :rows="3"
            placeholder="Optional description"
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

        <NFormItem :label="t('common.popular')">
          <NSwitch v-model:value="formValue.isPopular" />
        </NFormItem>

        <NFormItem label="Active">
          <NSwitch v-model:value="formValue.isActive" />
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
            :loading="createMutation.isPending.value"
            @click="handleSubmit"
          >
            {{ t('common.create') }}
          </NButton>
        </div>
      </NForm>
      </div>
    </div>
  </div>
</template>
