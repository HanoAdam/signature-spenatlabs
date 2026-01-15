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
      // Create organization first
      const orgName = user.user_metadata?.organization_name || `${user.email?.split("@")[0]}'s Organization`
      const orgSlug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")

      console.log("[v0] Dashboard layout - Creating org:", orgName)

      const { data: newOrg, error: orgError } = await serviceClient
        .from("organizations")
        .insert({ name: orgName, slug: `${orgSlug}-${Date.now()}` })
        .select()
        .single()

      console.log("[v0] Dashboard layout - Org created:", !!newOrg, orgError?.message)

      if (newOrg) {
        const { data: newUser, error: userError } = await serviceClient
          .from("users")
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            organization_id: newOrg.id,
            role: "admin",
          })
          .select("*, organizations(*)")
          .single()

        console.log("[v0] Dashboard layout - User created:", !!newUser, userError?.message)
        userProfile = newUser
      }
    } else {
      console.log("[v0] Dashboard layout - Service client not available")
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
