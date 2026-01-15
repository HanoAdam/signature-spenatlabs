import { createClient } from "@/lib/supabase/server"
import { DocumentsTable } from "@/components/documents/documents-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function DocumentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userProfile } = await supabase.from("users").select("organization_id").eq("id", user.id).single()

  if (!userProfile) return null

  const { data: documents } = await supabase
    .from("documents")
    .select(
      `
      *,
      recipients (id, name, email, role, status),
      document_files (id, file_type, url, filename)
    `,
    )
    .eq("organization_id", userProfile.organization_id)
    .order("created_at", { ascending: false })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage and track all your documents</p>
        </div>
        <Button asChild>
          <Link href="/documents/new">
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </Link>
        </Button>
      </div>

      <DocumentsTable documents={documents || []} />
    </div>
  )
}
