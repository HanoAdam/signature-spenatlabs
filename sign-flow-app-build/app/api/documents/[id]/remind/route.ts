import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateReminderEmail, sendEmail } from "@/lib/utils/email"

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

    const { recipientId } = await request.json()

    // Get document and recipient
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*, recipients(*)")
      .eq("id", id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const recipient = document.recipients.find((r: { id: string }) => r.id === recipientId)
    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    }

    if (recipient.status === "signed") {
      return NextResponse.json({ error: "Recipient has already signed" }, { status: 400 })
    }

    const { data: signingSession } = await supabase
      .from("signing_sessions")
      .select("token")
      .eq("recipient_id", recipient.id)
      .single()

    if (!signingSession?.token) {
      return NextResponse.json({ error: "No signing session found for recipient" }, { status: 400 })
    }

    // Get sender info
    const { data: senderProfile } = await supabase.from("users").select("full_name, email").eq("id", user.id).single()

    const senderName = senderProfile?.full_name || senderProfile?.email || "Someone"
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const signingUrl = `${baseUrl}/sign/${signingSession.token}`

    // Send reminder email
    const emailTemplate = generateReminderEmail({
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      documentTitle: document.title,
      senderName,
      signingUrl,
    })

    const { success, error } = await sendEmail(emailTemplate)

    if (!success) {
      return NextResponse.json({ error: error || "Failed to send reminder" }, { status: 500 })
    }

    // Update last reminded timestamp
    await supabase.from("recipients").update({ last_reminded_at: new Date().toISOString() }).eq("id", recipientId)

    // Log audit event
    await supabase.from("audit_events").insert({
      organization_id: document.organization_id,
      document_id: id,
      event_type: "recipient.reminder_sent",
      actor_user_id: user.id,
      actor_email: user.email,
      recipient_id: recipientId,
      metadata: { recipient_email: recipient.email },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remind error:", error)
    return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 })
  }
}
