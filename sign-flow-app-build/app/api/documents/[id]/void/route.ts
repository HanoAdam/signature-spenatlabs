import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get document
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("organization_id")
      .eq("id", id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Void document
    await supabase
      .from("documents")
      .update({
        status: "voided",
        voided_at: new Date().toISOString(),
      })
      .eq("id", id)

    // Log audit event
    await supabase.from("audit_events").insert({
      organization_id: document.organization_id,
      document_id: id,
      event_type: "document.voided",
      actor_user_id: user.id,
      actor_email: user.email,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Void document error:", error)
    return NextResponse.json({ error: "Failed to void document" }, { status: 500 })
  }
}
