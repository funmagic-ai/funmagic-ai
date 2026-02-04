import { createClient } from "@funmagic/auth/client"

const baseUrl = process.env.NEXT_PUBLIC_API_URL;
if (!baseUrl) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
}

export const authClient = createClient(baseUrl)

export const { signIn, signUp, signOut, useSession, updateUser } = authClient
