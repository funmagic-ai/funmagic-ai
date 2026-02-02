export type FormState<T = Record<string, string[]>> = {
  success: boolean
  message?: string
  errors?: T
}
