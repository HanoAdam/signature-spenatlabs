import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { CertificateView } from "@/components/documents/certificate-view"

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: document, error } = await supabase
    .from("documents")
    .select(`
      *,
      recipients(*),
      audit_events(*)
    `)
    .eq("id", id)
    .single()

  if (error || !document) {
    notFound()
  }

  if (document.status !== "completed") {
    notFound()
  }

  return <CertificateView document={document} />
}
