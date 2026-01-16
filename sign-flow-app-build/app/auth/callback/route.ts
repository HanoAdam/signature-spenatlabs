import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

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
        // Try to use service client for profile creation (bypasses RLS)
        // Fall back to regular client if service key not available
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        const profileClient = supabaseServiceKey && supabaseUrl
          ? createServiceClient(supabaseUrl, supabaseServiceKey, {
              auth: { autoRefreshToken: false, persistSession: false },
            })
          : supabase

        console.log("[v0] Auth callback - Using service client:", !!supabaseServiceKey)

        // Create organization for new user
        // Note: sign-up page uses 'org_name' in metadata
        const orgName = data.user.user_metadata?.org_name || data.user.user_metadata?.organization_name || `${data.user.email?.split("@")[0] || "User"}'s Organization`
        const slug = orgName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")

        console.log("[v0] Auth callback - Creating org:", orgName, "for user:", data.user.id)

        const { data: org, error: orgError } = await profileClient
          .from("organizations")
          .insert({
            name: orgName,
            slug: `${slug}-${Date.now()}`,
          })
          .select()
          .single()

        console.log("[v0] Auth callback - Org creation result:", !!org, orgError?.message, orgError?.code)

        if (orgError) {
          console.error("[v0] Auth callback - Failed to create org:", orgError)
          // Continue anyway - dashboard layout will try again with service client
        }

        if (org) {
          // Create user profile
          const { error: userError } = await profileClient.from("users").insert({
            id: data.user.id,
            organization_id: org.id,
            email: data.user.email!,
            full_name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User",
            role: "admin",
          })

          console.log("[v0] Auth callback - User creation result:", !userError, userError?.message, userError?.code)

          if (userError) {
            console.error("[v0] Auth callback - Failed to create user:", userError)
            // If user creation fails but org was created, dashboard layout will handle it
          }
        }
      }

      console.log("[v0] Auth callback - success, redirecting to:", next)
      return response
    }

    console.log("[v0] Auth callback - failed, error:", error?.message)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
