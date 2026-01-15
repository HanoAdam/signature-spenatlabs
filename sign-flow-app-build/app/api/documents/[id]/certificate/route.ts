import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Get document with recipients and audit events
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select(`
      *,
      recipients(*),
      audit_events(*)
    `)
    .eq("id", id)
    .single()

  if (docError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  if (document.status !== "completed") {
    return NextResponse.json({ error: "Certificate only available for completed documents" }, { status: 400 })
  }

  // Generate certificate data
  const certificate = {
    documentId: document.id,
    title: document.title,
    completedAt: document.completed_at,
    createdAt: document.created_at,
    signers: document.recipients.map((r: { name: string; email: string; signed_at: string }) => ({
      name: r.name,
      email: r.email,
      signedAt: r.signed_at,
    })),
    auditTrail: document.audit_events.map(
      (e: { event_type: string; created_at: string; ip_address: string; metadata: Record<string, unknown> }) => ({
        event: e.event_type,
        timestamp: e.created_at,
        ipAddress: e.ip_address,
        metadata: e.metadata,
      }),
    ),
    certificateId: `CERT-${document.id.slice(0, 8).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
  }

  return NextResponse.json(certificate)
}
