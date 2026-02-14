import type { FormInst } from 'naive-ui'

/**
 * Scroll to the first validation error in the page.
 * Uses double nextTick to wait for Naive UI's error feedback transition to render.
 */
function scrollToFirstError() {
  nextTick(() => {
    nextTick(() => {
      // Naive UI renders error feedback with class `n-form-item-feedback--error`
      // Find it and scroll its parent form-item into view
      const feedbackEl = document.querySelector('.n-form-item-feedback--error')
      const formItemEl = feedbackEl?.closest('.n-form-item') ?? feedbackEl
      if (formItemEl) {
        formItemEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
      // Fallback: look for error-status blank (input border turns red)
      const blankEl = document.querySelector('[class*="form-item-blank--error"]')
      const parentItem = blankEl?.closest('.n-form-item') ?? blankEl
      if (parentItem) {
        parentItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  })
}

/**
 * Validate an NForm and scroll to the first error if validation fails.
 * Returns true if valid, false if invalid.
 */
export async function validateForm(formRef: Ref<FormInst | null>): Promise<boolean> {
  try {
    await formRef.value?.validate()
    return true
  } catch {
    scrollToFirstError()
    return false
  }
}

/**
 * Scroll a specific element into view (e.g. TranslationsEditor card).
 */
export function scrollToElement(el: Ref<{ $el?: HTMLElement } | null>) {
  nextTick(() => {
    const target = el.value?.$el ?? (el.value as unknown as HTMLElement)
    if (target?.scrollIntoView) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}
