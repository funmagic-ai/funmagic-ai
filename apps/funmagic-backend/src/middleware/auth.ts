import { auth, type User, type Session } from "@funmagic/auth/server"
import { AppError, ERROR_CODES } from "@funmagic/shared"
import { createMiddleware } from "hono/factory"

type Variables = {
  user: User
  session: Session["session"]
}

export const requireAuth = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session) {
    throw new AppError({
      code: ERROR_CODES.AUTH_UNAUTHORIZED,
      message: 'Unauthorized',
      statusCode: 401,
    })
  }

  c.set("user", session.user)
  c.set("session", session.session)
  await next()
})

export const requireAdmin = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const user = c.get("user")
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    throw new AppError({
      code: ERROR_CODES.AUTH_FORBIDDEN,
      message: 'Forbidden',
      statusCode: 403,
    })
  }
  await next()
})
