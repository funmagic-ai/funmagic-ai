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
  email: '',
  password: '',
})

const rules = computed<FormRules>(() => ({
  email: [
    { required: true, message: t('auth.validation.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('auth.validation.emailInvalid'), trigger: 'blur' },
  ],
  password: [
    { required: true, message: t('auth.validation.passwordRequired'), trigger: 'blur' },
    { min: 6, message: t('auth.validation.passwordMin6'), trigger: 'blur' },
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
    const result = await authStore.signIn(formValue.value.email, formValue.value.password)
    if (result.error) {
      errorMsg.value = result.error.message || t('auth.loginError')
      return
    }
    message.success(t('auth.welcomeBack'))
    router.push({ name: 'home', params: { locale: locale.value } })
  } catch (err: unknown) {
    const e = err as { message?: string }
    errorMsg.value = e?.message || t('auth.loginError')
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
          <h1 class="text-3xl font-bold text-foreground">{{ t('auth.loginTitle') }}</h1>
          <p class="mt-2 text-muted-foreground">{{ t('auth.loginSubtitle') }}</p>
        </div>

        <n-card>
          <n-form
            ref="formRef"
            :model="formValue"
            :rules="rules"
            label-placement="top"
            @submit.prevent="handleSubmit"
          >
            <n-form-item :label="t('auth.email')" path="email">
              <n-input
                v-model:value="formValue.email"
                type="text"
                :placeholder="t('auth.email')"
                :input-props="{ autocomplete: 'email' }"
                size="large"
                @keydown.enter="handleSubmit"
              />
            </n-form-item>

            <n-form-item :label="t('auth.password')" path="password">
              <n-input
                v-model:value="formValue.password"
                type="password"
                show-password-on="click"
                :placeholder="t('auth.password')"
                :input-props="{ autocomplete: 'current-password' }"
                size="large"
                @keydown.enter="handleSubmit"
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
              {{ t('auth.signIn') }}
            </n-button>
          </n-form>

          <div class="mt-6 text-center text-sm">
            <span class="text-muted-foreground">{{ t('auth.noAccount') }} </span>
            <router-link
              :to="{ name: 'register', params: { locale } }"
              class="text-primary font-medium hover:underline"
            >
              {{ t('auth.signUp') }}
            </router-link>
          </div>
        </n-card>
      </div>
    </div>
  </AppLayout>
</template>
