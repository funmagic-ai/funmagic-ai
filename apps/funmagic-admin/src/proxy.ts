import { auth, type Session } from "@funmagic/auth/server"
import { isAdmin } from "@funmagic/auth/permissions"
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/auth") || pathname === "/login" || pathname === "/unauthorized") {
    return NextResponse.next()
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  }) as Session | null

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (!isAdmin(session.user.role)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
