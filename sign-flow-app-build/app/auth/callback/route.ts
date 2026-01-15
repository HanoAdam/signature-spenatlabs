import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  console.log("[v0] Auth callback - code:", !!code, "next:", next)

  if (code) {
    const cookieStore = await cookies()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.log("[v0] Auth callback - Missing env vars")
      return NextResponse.redirect(`${origin}/auth/login?error=server_error`)
    }

    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log("[v0] Auth callback - exchangeCodeForSession:", !!data?.user, error?.message)

    if (!error && data.user) {
      // Check if user profile exists, if not create one with org
      const { data: existingUser } = await supabase.from("users").select("id").eq("id", data.user.id).single()

      console.log("[v0] Auth callback - existing user:", !!existingUser)

      if (!existingUser) {
        // Create organization for new user
        const orgName = data.user.user_metadata?.organization_name || "My Organization"
        const slug = orgName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")

        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .insert({
            name: orgName,
            slug: `${slug}-${Date.now()}`,
          })
          .select()
          .single()

        console.log("[v0] Auth callback - created org:", !!org, orgError?.message)

        if (org) {
          // Create user profile
          const { error: userError } = await supabase.from("users").insert({
            id: data.user.id,
            organization_id: org.id,
            email: data.user.email!,
            full_name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User",
            role: "admin",
          })

          console.log("[v0] Auth callback - created user:", !userError, userError?.message)
        }
      }

      console.log("[v0] Auth callback - success, redirecting to:", next)
      return response
    }

    console.log("[v0] Auth callback - failed, error:", error?.message)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
