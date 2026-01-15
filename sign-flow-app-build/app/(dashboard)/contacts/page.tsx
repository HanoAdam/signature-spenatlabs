import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ContactsTable } from "@/components/contacts/contacts-table"

export default async function ContactsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: userProfile } = await supabase.from("users").select("organization_id").eq("id", user.id).single()

  if (!userProfile) redirect("/auth/login")

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("organization_id", userProfile.organization_id)
    .order("name")

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground">Manage your signing contacts and recipients</p>
      </div>

      <ContactsTable contacts={contacts || []} organizationId={userProfile.organization_id} />
    </div>
  )
}
