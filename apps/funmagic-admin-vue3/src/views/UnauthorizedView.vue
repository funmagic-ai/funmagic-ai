<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import { LockClosedOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div class="w-full max-w-md text-center">
      <div class="mb-6 flex justify-center">
        <div
          class="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive"
        >
          <NIcon :size="32">
            <LockClosedOutline />
          </NIcon>
        </div>
      </div>

      <h1 class="mb-2 text-2xl font-bold text-foreground">
        {{ t('auth.unauthorized') }}
      </h1>
      <p class="mb-8 text-muted-foreground">
        {{ t('auth.unauthorizedMessage') }}
      </p>

      <NButton type="primary" @click="goToLogin">
        {{ t('auth.backToLogin') }}
      </NButton>
    </div>
  </div>
</template>
