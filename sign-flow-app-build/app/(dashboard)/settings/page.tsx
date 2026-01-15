import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/settings/settings-form"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: userProfile } = await supabase.from("users").select("*, organizations(*)").eq("id", user.id).single()

  if (!userProfile) redirect("/auth/login")

  // Get team members
  const { data: teamMembers } = await supabase
    .from("users")
    .select("*")
    .eq("organization_id", userProfile.organization_id)
    .order("created_at")

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your organization and account settings</p>
      </div>

      <SettingsForm user={userProfile} organization={userProfile.organizations} teamMembers={teamMembers || []} />
    </div>
  )
}
