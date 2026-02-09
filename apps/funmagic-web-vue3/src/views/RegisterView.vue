<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/layout/AppLayout.vue'
import type { FormInst, FormRules } from 'naive-ui'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const message = useMessage()

const locale = computed(() => (route.params.locale as string) || 'en')

const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const errorMsg = ref('')

const formValue = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const rules = computed<FormRules>(() => ({
  name: [
    { required: true, message: t('auth.validation.nameRequired'), trigger: 'blur' },
    { min: 2, message: t('auth.validation.nameMin2'), trigger: 'blur' },
  ],
  email: [
    { required: true, message: t('auth.validation.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('auth.validation.emailInvalid'), trigger: 'blur' },
  ],
  password: [
    { required: true, message: t('auth.validation.passwordRequired'), trigger: 'blur' },
    { min: 8, message: t('auth.validation.passwordMin8'), trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: t('auth.validation.confirmPasswordRequired'), trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string) => {
        if (value !== formValue.value.password) {
          return new Error(t('auth.validation.passwordsMismatch'))
        }
        return true
      },
      trigger: 'blur',
    },
  ],
}))

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    const result = await authStore.signUp(
      formValue.value.name,
      formValue.value.email,
      formValue.value.password,
    )
    if (result.error) {
      errorMsg.value = result.error.message || t('auth.registerError')
      return
    }
    message.success(t('auth.accountCreated'))
    router.push({ name: 'home', params: { locale: locale.value } })
  } catch (err: unknown) {
    const e = err as { message?: string }
    errorMsg.value = e?.message || t('auth.registerError')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-foreground">{{ t('auth.registerTitle') }}</h1>
          <p class="mt-2 text-muted-foreground">{{ t('auth.registerSubtitle') }}</p>
        </div>

        <n-card>
          <n-form
            ref="formRef"
            :model="formValue"
            :rules="rules"
            label-placement="top"
            @submit.prevent="handleSubmit"
          >
            <n-form-item :label="t('auth.name')" path="name">
              <n-input
                v-model:value="formValue.name"
                :placeholder="t('auth.name')"
                size="large"
              />
            </n-form-item>

            <n-form-item :label="t('auth.email')" path="email">
              <n-input
                v-model:value="formValue.email"
                type="text"
                :placeholder="t('auth.email')"
                size="large"
              />
            </n-form-item>

            <n-form-item :label="t('auth.password')" path="password">
              <n-input
                v-model:value="formValue.password"
                type="password"
                show-password-on="click"
                :placeholder="t('auth.password')"
                size="large"
              />
            </n-form-item>

            <n-form-item :label="t('auth.confirmPassword')" path="confirmPassword">
              <n-input
                v-model:value="formValue.confirmPassword"
                type="password"
                show-password-on="click"
                :placeholder="t('auth.confirmPassword')"
                size="large"
              />
            </n-form-item>

            <n-alert
              v-if="errorMsg"
              type="error"
              :bordered="false"
              closable
              class="mb-4"
              @close="errorMsg = ''"
            >
              {{ errorMsg }}
            </n-alert>

            <n-button
              type="primary"
              size="large"
              block
              :loading="loading"
              :disabled="loading"
              attr-type="submit"
              @click="handleSubmit"
            >
              {{ t('auth.signUp') }}
            </n-button>
          </n-form>

          <div class="mt-6 text-center text-sm">
            <span class="text-muted-foreground">{{ t('auth.hasAccount') }} </span>
            <router-link
              :to="{ name: 'login', params: { locale } }"
              class="text-primary font-medium hover:underline"
            >
              {{ t('auth.signIn') }}
            </router-link>
          </div>
        </n-card>
      </div>
    </div>
  </AppLayout>
</template>
