import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { DocumentDetailView } from "@/components/documents/document-detail-view"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: document, error } = await supabase
    .from("documents")
    .select(
      `
      *,
      recipients (*),
      document_files (*),
      fields (*),
      signing_sessions (*)
    `,
    )
    .eq("id", id)
    .single()

  if (error || !document) {
    notFound()
  }

  // Get audit events
  const { data: auditEvents } = await supabase
    .from("audit_events")
    .select("*")
    .eq("document_id", id)
    .order("created_at", { ascending: false })

  return <DocumentDetailView document={document} auditEvents={auditEvents || []} />
}
