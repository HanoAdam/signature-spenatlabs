import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TemplateBuilder } from "@/components/templates/template-builder"

export default async function NewTemplatePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: userProfile } = await supabase.from("users").select("organization_id").eq("id", user.id).single()

  if (!userProfile) redirect("/auth/login")

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Create Template</h1>
        <p className="text-muted-foreground">Upload a PDF and configure reusable field placements</p>
      </div>

      <TemplateBuilder organizationId={userProfile.organization_id} userId={user.id} />
    </div>
  )
}
