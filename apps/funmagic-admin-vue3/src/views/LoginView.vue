<script setup lang="ts">
import { NForm, NFormItem, NInput, NButton, NCard, NIcon } from 'naive-ui'
import type { FormRules, FormInst } from 'naive-ui'
import { SpeedometerOutline } from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const router = useRouter()
const { t } = useI18n()

const formRef = ref<FormInst | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref('')

const model = reactive({
  email: '',
  password: '',
})

const rules: FormRules = {
  email: [
    {
      required: true,
      message: t('validation.emailRequired'),
      trigger: 'blur',
    },
    {
      type: 'email',
      message: t('validation.emailFormat'),
      trigger: ['blur', 'input'],
    },
  ],
  password: [
    {
      required: true,
      message: t('validation.passwordRequired'),
      trigger: 'blur',
    },
    {
      min: 6,
      message: t('validation.passwordMinLength'),
      trigger: 'blur',
    },
  ],
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const result = await authStore.signIn(model.email, model.password)

    if (result.error) {
      errorMessage.value = t('auth.loginError')
      return
    }

    // Wait briefly for session to update
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!authStore.isAdmin) {
      errorMessage.value = t('auth.loginError')
      await authStore.signOut()
      return
    }

    router.push('/dashboard')
  } catch {
    errorMessage.value = t('auth.loginError')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-background px-4">
    <div class="w-full max-w-sm">
      <!-- Logo & Title -->
      <div class="mb-8 flex flex-col items-center gap-3">
        <div
          class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground"
        >
          <NIcon :size="28">
            <SpeedometerOutline />
          </NIcon>
        </div>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-foreground">
            {{ t('common.appName') }}
          </h1>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ t('auth.loginSubtitle') }}
          </p>
        </div>
      </div>

      <!-- Login Card -->
      <NCard>
        <NForm
          ref="formRef"
          :model="model"
          :rules="rules"
          label-placement="top"
          require-mark-placement="right-hanging"
          @keyup.enter="handleSubmit"
        >
          <NFormItem :label="t('auth.email')" path="email">
            <NInput
              v-model:value="model.email"
              type="text"
              :placeholder="t('auth.email')"
              :input-props="{ autocomplete: 'email' }"
            />
          </NFormItem>

          <NFormItem :label="t('auth.password')" path="password">
            <NInput
              v-model:value="model.password"
              type="password"
              show-password-on="click"
              :placeholder="t('auth.password')"
              :input-props="{ autocomplete: 'current-password' }"
            />
          </NFormItem>

          <!-- Error message -->
          <div
            v-if="errorMessage"
            class="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {{ errorMessage }}
          </div>

          <NButton
            type="primary"
            block
            strong
            :loading="isSubmitting"
            :disabled="isSubmitting"
            @click="handleSubmit"
          >
            {{ t('auth.signIn') }}
          </NButton>
        </NForm>
      </NCard>
    </div>
  </div>
</template>
