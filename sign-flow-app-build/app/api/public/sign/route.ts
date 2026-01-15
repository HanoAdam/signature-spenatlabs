import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { token, fieldValues } = await request.json()

    // Get request info for audit
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    // Validate token and get session
    const { data: session, error: sessionError } = await supabase
      .from("signing_sessions")
      .select(
        `
        *,
        recipients (*),
        documents (*, organization_id, recipients(*))
      `,
      )
      .eq("token", token)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Invalid signing session" }, { status: 400 })
    }

    // Validate token hasn't expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: "Signing link has expired" }, { status: 400 })
    }

    // Validate document isn't voided
    if (session.documents.status === "voided") {
      return NextResponse.json({ error: "Document has been voided" }, { status: 400 })
    }

    // Validate recipient hasn't already signed
    if (session.recipients.status === "signed") {
      return NextResponse.json({ error: "You have already signed this document" }, { status: 400 })
    }

    // Update field values
    for (const [fieldId, value] of Object.entries(fieldValues)) {
      await supabase
        .from("fields")
        .update({
          value: value,
          signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", fieldId)
        .eq("recipient_id", session.recipient_id)
    }

    // Update recipient status
    await supabase
      .from("recipients")
      .update({
        status: "signed",
        signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.recipient_id)

    // Update signing session
    await supabase
      .from("signing_sessions")
      .update({
        used_at: new Date().toISOString(),
        ip_address: ip,
        user_agent: userAgent,
      })
      .eq("id", session.id)

    // Log audit event
    await supabase.from("audit_events").insert({
      organization_id: session.documents.organization_id,
      document_id: session.document_id,
      event_type: "recipient.signed",
      actor_email: session.recipients.email,
      actor_name: session.recipients.name,
      ip_address: ip,
      user_agent: userAgent,
      metadata: { recipient_id: session.recipient_id },
    })

    // Check if all required signers have signed
    const allRecipients = session.documents.recipients || []
    const requiredSigners = allRecipients.filter((r: { role: string }) => r.role === "signer" || r.role === "approver")

    // Refresh recipients to get updated status
    const { data: updatedRecipients } = await supabase
      .from("recipients")
      .select("*")
      .eq("document_id", session.document_id)

    const allSigned = requiredSigners.every((r: { id: string }) => {
      const updated = updatedRecipients?.find((ur: { id: string }) => ur.id === r.id)
      return updated?.status === "signed"
    })

    if (allSigned) {
      // Mark document as completed
      await supabase
        .from("documents")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.document_id)

      // Log completion audit event
      await supabase.from("audit_events").insert({
        organization_id: session.documents.organization_id,
        document_id: session.document_id,
        event_type: "document.completed",
        metadata: { final_signer: session.recipients.email },
      })
    }

    return NextResponse.json({ success: true, documentCompleted: allSigned })
  } catch (error) {
    console.error("Signing error:", error)
    return NextResponse.json({ error: "Failed to process signature" }, { status: 500 })
  }
}
