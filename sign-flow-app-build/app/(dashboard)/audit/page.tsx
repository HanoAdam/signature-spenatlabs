import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuditTable } from "@/components/audit/audit-table"

export default async function AuditPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: userProfile } = await supabase.from("users").select("organization_id").eq("id", user.id).single()

  if (!userProfile) redirect("/auth/login")

  const { data: auditEvents } = await supabase
    .from("audit_events")
    .select("*, documents(title)")
    .eq("organization_id", userProfile.organization_id)
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">Complete history of all actions in your organization</p>
      </div>

      <AuditTable events={auditEvents || []} />
    </div>
  )
}
