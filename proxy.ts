// proxy.ts (antes middleware.ts — renombrado en Next.js 16)
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Configuramos en qué rutas corre el proxy:
export const config = {
  matcher: [
    "/admin/:path*",
    "/user/:path*",
    "/checkout/:path*",
    "/login",
    "/signup",
  ],
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("token")?.value

  // 1) Rutas protegidas: /admin, /user, /checkout
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/user") 
  ) {
    if (!token) {
      // si no hay token, redirigimos a login y borramos la cookie
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = "/login"
      const res = NextResponse.redirect(loginUrl)
      res.cookies.set("token", "", { path: "/", maxAge: 0 })
      return res
    }
  }

  // 2) Si ya estás logueado e intentas ir a /login o /signup, te mandamos a /user
  if (token && (pathname === "/login" || pathname === "/signup")) {
    const userUrl = request.nextUrl.clone()
    userUrl.pathname = "/user"
    return NextResponse.redirect(userUrl)
  }

  // 3) En cualquier otro caso, continúa normalmente
  return NextResponse.next()
}
