import { createClient } from "@funmagic/auth/client"

export const authClient = createClient(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
)

export const { signIn, signUp, signOut, useSession, updateUser } = authClient
