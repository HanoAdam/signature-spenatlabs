import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient as createServiceClient } from "@supabase/supabase-js"

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log("[v0] Dashboard layout - Starting")

  const supabase = await createClient()

  console.log("[v0] Dashboard layout - Supabase client created:", !!supabase)

  if (!supabase) {
    console.log("[v0] Dashboard layout - Supabase not configured, redirecting to login")
    redirect("/auth/login")
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log("[v0] Dashboard layout - getUser result:", !!user, user?.id, error?.message)

  if (error || !user) {
    console.log("[v0] Dashboard layout - No user, redirecting to login")
    redirect("/auth/login")
  }

  // Get user profile with organization
  console.log("[v0] Dashboard layout - Fetching profile for user:", user.id)

  let { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("*, organizations(*)")
    .eq("id", user.id)
    .single()

  console.log("[v0] Dashboard layout - Profile result:", !!userProfile, profileError?.message)

  if (!userProfile) {
    console.log("[v0] Dashboard layout - No profile, attempting to create")
    const serviceClient = getServiceClient()

    if (serviceClient) {
      // Check if user already has an org (maybe from a previous failed attempt)
      // First, try to find any existing orgs for this user
      const { data: existingOrgs } = await serviceClient
        .from("organizations")
        .select("id, name")
        .limit(1)

      let orgToUse = null

      if (existingOrgs && existingOrgs.length > 0) {
        // Use first available org (in case user was partially created)
        orgToUse = existingOrgs[0]
        console.log("[v0] Dashboard layout - Found existing org:", orgToUse.id)
      } else {
        // Create organization first
        // Note: sign-up page uses 'org_name' in metadata
        const orgName = user.user_metadata?.org_name || user.user_metadata?.organization_name || `${user.email?.split("@")[0] || "User"}'s Organization`
        const orgSlug = orgName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")

        console.log("[v0] Dashboard layout - Creating org:", orgName, "for user:", user.id)

        const { data: newOrg, error: orgError } = await serviceClient
          .from("organizations")
          .insert({ name: orgName, slug: `${orgSlug}-${Date.now()}` })
          .select()
          .single()

        console.log("[v0] Dashboard layout - Org created:", !!newOrg, orgError?.message, orgError?.code)

        if (orgError) {
          console.error("[v0] Dashboard layout - Failed to create org:", orgError)
          // If org creation fails due to duplicate, try to find it
          if (orgError.code === "23505") {
            const { data: foundOrg } = await serviceClient
              .from("organizations")
              .select("id, name")
              .eq("name", orgName)
              .limit(1)
              .single()
            if (foundOrg) {
              orgToUse = foundOrg
              console.log("[v0] Dashboard layout - Found duplicate org:", foundOrg.id)
            }
          }
        } else {
          orgToUse = newOrg
        }
      }

      if (orgToUse) {
        // Check if user already exists (maybe insert failed but user was created)
        const { data: existingUser } = await serviceClient
          .from("users")
          .select("*, organizations(*)")
          .eq("id", user.id)
          .single()

        if (existingUser) {
          console.log("[v0] Dashboard layout - User already exists, using it")
          userProfile = existingUser
        } else {
          // Create user profile
          const { data: newUser, error: userError } = await serviceClient
            .from("users")
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
              organization_id: orgToUse.id,
              role: "admin",
            })
            .select("*, organizations(*)")
            .single()

          console.log("[v0] Dashboard layout - User created:", !!newUser, userError?.message, userError?.code)

          if (userError) {
            console.error("[v0] Dashboard layout - Failed to create user:", userError)
            // If user already exists (race condition), fetch it
            if (userError.code === "23505") {
              const { data: fetchedUser } = await serviceClient
                .from("users")
                .select("*, organizations(*)")
                .eq("id", user.id)
                .single()
              if (fetchedUser) {
                userProfile = fetchedUser
                console.log("[v0] Dashboard layout - User existed, fetched it")
              }
            }
          } else {
            userProfile = newUser
          }
        }
      }
    } else {
      console.log("[v0] Dashboard layout - Service client not available - SUPABASE_SERVICE_ROLE_KEY may be missing")
    }
  }

  // Still no profile? Redirect to login with error
  if (!userProfile) {
    console.log("[v0] Dashboard layout - Still no profile, redirecting with error")
    redirect("/auth/login?error=profile_setup_failed")
  }

  console.log("[v0] Dashboard layout - Success, rendering dashboard")

  return (
    <SidebarProvider>
      <AppSidebar user={userProfile} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>SignFlow</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
