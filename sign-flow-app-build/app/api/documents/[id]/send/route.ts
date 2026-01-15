import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateSigningToken, getTokenExpiryDate } from "@/lib/utils/tokens"
import { generateSignatureRequestEmail, sendEmail } from "@/lib/utils/email"

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

    // Get document with recipients
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*, recipients(*), organizations(name)")
      .eq("id", id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const { data: senderProfile } = await supabase.from("users").select("full_name, email").eq("id", user.id).single()

    const senderName = senderProfile?.full_name || senderProfile?.email || "Someone"
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create signing sessions for recipients who don't have one
    for (const recipient of document.recipients || []) {
      if (recipient.role !== "cc") {
        // Check if session exists
        const { data: existingSession } = await supabase
          .from("signing_sessions")
          .select("id, token")
          .eq("recipient_id", recipient.id)
          .single()

        let token = existingSession?.token

        if (!existingSession) {
          token = generateSigningToken()
          await supabase.from("signing_sessions").insert({
            recipient_id: recipient.id,
            document_id: document.id,
            token,
            expires_at: getTokenExpiryDate(7).toISOString(),
          })
        }

        // Update recipient status to sent
        await supabase.from("recipients").update({ status: "sent" }).eq("id", recipient.id)

        if (token) {
          const signingUrl = `${baseUrl}/sign/${token}`
          const emailTemplate = generateSignatureRequestEmail({
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            documentTitle: document.title,
            senderName,
            signingUrl,
          })

          await sendEmail(emailTemplate)

          // Log email sent audit event
          await supabase.from("audit_events").insert({
            organization_id: document.organization_id,
            document_id: id,
            event_type: "recipient.email_sent",
            actor_user_id: user.id,
            actor_email: user.email,
            recipient_id: recipient.id,
            metadata: { recipient_email: recipient.email },
          })
        }
      }
    }

    // Update document status
    await supabase.from("documents").update({ status: "pending" }).eq("id", id)

    // Log audit event
    await supabase.from("audit_events").insert({
      organization_id: document.organization_id,
      document_id: id,
      event_type: "document.sent",
      actor_user_id: user.id,
      actor_email: user.email,
      metadata: { recipient_count: document.recipients?.length || 0 },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Send document error:", error)
    return NextResponse.json({ error: "Failed to send document" }, { status: 500 })
  }
}
