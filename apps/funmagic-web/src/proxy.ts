import { auth } from "@funmagic/auth/server"
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

const intlMiddleware = createIntlMiddleware(routing)

const publicPaths = ["/", "/login", "/register", "/api/auth", "/tools", "/pricing"]

function isPublicPath(pathname: string): boolean {
  const strippedPath = pathname.replace(/^\/(en|zh)/, "") || "/"
  return publicPaths.some((p) => strippedPath === p || strippedPath.startsWith(p + "/"))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  const intlResponse = intlMiddleware(request)

  if (isPublicPath(pathname)) {
    return intlResponse
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    const locale = pathname.match(/^\/(en|zh)/)?.[1] || routing.defaultLocale
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  return intlResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
}
