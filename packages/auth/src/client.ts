import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"
import type { auth } from "./server"

export const createClient = (baseURL: string) => createAuthClient({
  baseURL,
  plugins: [inferAdditionalFields<typeof auth>()],
})

export type AuthClient = ReturnType<typeof createClient>
