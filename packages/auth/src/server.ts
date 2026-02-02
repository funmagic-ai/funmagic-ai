import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@funmagic/database"
import * as schema from "@funmagic/database/schema"

// Environment variables
const TRUSTED_ORIGINS = (process.env.TRUSTED_ORIGINS ?? 'http://localhost:3000,http://localhost:3001').split(',')

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,

  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
  },

  trustedOrigins: TRUSTED_ORIGINS,

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
})

export type Auth = typeof auth
