import { betterAuth, type BetterAuthOptions } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@funmagic/database"
import { getRedis } from "@funmagic/services/redis"
import * as schema from "@funmagic/database/schema"

// Define config as const to preserve type information
const authConfig = {
  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
    },
  },

  advanced: {
    database: {
      generateId: false, // Use database-generated UUIDs
    },
  },
} as const satisfies BetterAuthOptions

// Lazy initialization to avoid issues when env vars aren't loaded yet
let _auth: ReturnType<typeof betterAuth<typeof authConfig>> | null = null

function createAuth() {
  const TRUSTED_ORIGINS = process.env.TRUSTED_ORIGINS?.split(',')
  const redis = getRedis()

  return betterAuth({
    ...authConfig,

    baseURL: process.env.BETTER_AUTH_URL,

    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema: {
        ...schema,
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
      apple: {
        clientId: process.env.APPLE_CLIENT_ID as string,
        clientSecret: process.env.APPLE_CLIENT_SECRET as string,
      },
      facebook: {
        clientId: process.env.FACEBOOK_CLIENT_ID as string,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
      },
    },

    // Redis secondary storage for faster session lookups
    secondaryStorage: {
      get: async (key) => {
        const value = await redis.get(key)
        return value ? value : null
      },
      set: async (key, value, ttl) => {
        if (ttl) {
          await redis.setex(key, ttl, value)
        } else {
          await redis.set(key, value)
        }
      },
      delete: async (key) => {
        await redis.del(key)
      },
    },

    trustedOrigins: [
      ...(TRUSTED_ORIGINS || []),
      "https://appleid.apple.com",
    ],
  })
}

export function getAuth() {
  if (!_auth) {
    _auth = createAuth()
  }
  return _auth
}

// Type for the auth instance with proper inference
type AuthInstance = ReturnType<typeof betterAuth<typeof authConfig>>

// Backward-compatible lazy proxy with proper typing
export const auth = new Proxy({} as AuthInstance, {
  get(_, prop) {
    return (getAuth() as any)[prop]
  }
})

export type Auth = typeof auth

// Infer session and user types including additional fields
export type Session = typeof auth.$Infer.Session
export type User = Session["user"]
