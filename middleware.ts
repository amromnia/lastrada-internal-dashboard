import { type NextRequest, NextResponse } from "next/server"
import { isTokenExpired } from "@/lib/auth"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value
  const isValid = token && !isTokenExpired(token)

  // Redirect to login if accessing dashboard without valid auth
  if (!isValid && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect to dashboard if already logged in and accessing login
  if (isValid && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard", "/login", "/"],
}
