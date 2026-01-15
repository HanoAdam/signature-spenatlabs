import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  console.log("[v0] Proxy - URL:", request.nextUrl.pathname)
  console.log("[v0] Proxy - Env vars present:", !!supabaseUrl, !!supabaseAnonKey)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("[v0] Proxy - Missing env vars, skipping auth")
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // Do not run code between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Proxy - User found:", !!user, user?.id)

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard")

  if (isProtectedRoute && !user) {
    console.log("[v0] Proxy - No user, redirecting to login")
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  console.log("[v0] Proxy - Allowing request through")
  return supabaseResponse
}
