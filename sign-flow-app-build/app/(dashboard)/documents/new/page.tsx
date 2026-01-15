import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DocumentWizard } from "@/components/documents/document-wizard"

export default async function NewDocumentPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: userProfile } = await supabase.from("users").select("organization_id").eq("id", user.id).single()

  if (!userProfile) redirect("/auth/login")

  // Fetch templates for selection
  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, description, file_url, filename")
    .eq("organization_id", userProfile.organization_id)
    .eq("is_active", true)
    .order("name")

  // Fetch contacts for recipient selection
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, email, company")
    .eq("organization_id", userProfile.organization_id)
    .order("name")

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">New Document</h1>
        <p className="text-muted-foreground">Create a new document for signing</p>
      </div>

      <DocumentWizard
        templates={templates || []}
        contacts={contacts || []}
        organizationId={userProfile.organization_id}
        userId={user.id}
      />
    </div>
  )
}
