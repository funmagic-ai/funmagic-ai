<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/layout/AppLayout.vue'
import type { FormInst, FormRules } from 'naive-ui'

const { t, te } = useI18n()
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
  confirmPassword: '',
})

const socialLoading = ref<string | null>(null)

const rules = computed<FormRules>(() => ({
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

async function handleSocialSignIn(provider: 'google' | 'apple' | 'facebook') {
  socialLoading.value = provider
  try {
    await authStore.signInWithSocial(provider)
  } catch {
    errorMsg.value = t('auth.socialLoginError')
  } finally {
    socialLoading.value = null
  }
}

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
      formValue.value.email,
      formValue.value.password,
    )
    if (result.error) {
      const code = result.error.code
      const key = `auth.errorCodes.${code}`
      errorMsg.value = te(key) ? t(key) : t('auth.registerError')
      return
    }
    message.success(t('auth.accountCreated'))
    router.push({ name: 'home', params: { locale: locale.value } })
  } catch {
    errorMsg.value = t('auth.registerError')
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
          <div class="flex flex-col gap-3 mb-4">
            <n-button
              size="large"
              block
              :loading="socialLoading === 'google'"
              :disabled="!!socialLoading"
              @click="handleSocialSignIn('google')"
            >
              <template #icon>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </template>
              {{ t('auth.continueWithGoogle') }}
            </n-button>
            <n-button
              size="large"
              block
              :loading="socialLoading === 'apple'"
              :disabled="!!socialLoading"
              @click="handleSocialSignIn('apple')"
            >
              <template #icon>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-1.55 4.32-3.74 4.25z" />
                </svg>
              </template>
              {{ t('auth.continueWithApple') }}
            </n-button>
            <n-button
              size="large"
              block
              :loading="socialLoading === 'facebook'"
              :disabled="!!socialLoading"
              @click="handleSocialSignIn('facebook')"
            >
              <template #icon>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </template>
              {{ t('auth.continueWithFacebook') }}
            </n-button>
          </div>

          <n-divider>{{ t('auth.orContinueWith') }}</n-divider>

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
