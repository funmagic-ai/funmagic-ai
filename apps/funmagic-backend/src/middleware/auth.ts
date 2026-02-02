import { auth } from "@funmagic/auth/server"
import { createMiddleware } from "hono/factory"

type User = {
  id: string
  email: string
  name: string | null
  role: string
}

type Session = {
  id: string
  userId: string
  token: string
  expiresAt: Date
}

type Variables = {
  user: User
  session: Session
}

export const requireAuth = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  c.set("user", session.user as User)
  c.set("session", session.session as Session)
  await next()
})

export const requireAdmin = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const user = c.get("user")
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return c.json({ error: "Forbidden" }, 403)
  }
  await next()
})
