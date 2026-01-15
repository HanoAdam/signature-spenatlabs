import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateSigningToken, getTokenExpiryDate } from "@/lib/utils/tokens"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      pdfUrl,
      pdfFilename,
      pageCount,
      signingOrder,
      recipients,
      fields,
      organizationId,
      templateId,
      sendNow,
    } = body

    // Create document
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        organization_id: organizationId,
        created_by: user.id,
        title,
        description,
        status: sendNow ? "pending" : "draft",
        signing_order: signingOrder,
        template_id: templateId,
      })
      .select()
      .single()

    if (docError) throw docError

    // Create document file
    await supabase.from("document_files").insert({
      document_id: document.id,
      file_type: "original",
      url: pdfUrl,
      filename: pdfFilename,
      page_count: pageCount,
    })

    // Create recipients
    const recipientInserts = recipients.map(
      (r: { name: string; email: string; role: string; signing_order: number; contact_id?: string }, i: number) => ({
        document_id: document.id,
        contact_id: r.contact_id || null,
        name: r.name,
        email: r.email,
        role: r.role,
        signing_order: r.signing_order || i + 1,
        status: sendNow ? "sent" : "pending",
      }),
    )

    const { data: createdRecipients, error: recipError } = await supabase
      .from("recipients")
      .insert(recipientInserts)
      .select()

    if (recipError) throw recipError

    // Create fields with actual recipient IDs
    if (fields.length > 0 && createdRecipients) {
      const fieldInserts = fields.map(
        (f: {
          type: string
          page: number
          x: number
          y: number
          width: number
          height: number
          required: boolean
          recipient_id: string
        }) => {
          // Map temp recipient ID to actual ID
          let recipientId = f.recipient_id
          if (recipientId.startsWith("temp-")) {
            const tempIndex = Number.parseInt(recipientId.replace("temp-", ""))
            recipientId = createdRecipients[tempIndex]?.id || createdRecipients[0]?.id
          }
          return {
            document_id: document.id,
            recipient_id: recipientId,
            type: f.type,
            page: f.page,
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height,
            required: f.required,
          }
        },
      )

      await supabase.from("fields").insert(fieldInserts)
    }

    // If sending now, create signing sessions and send emails
    if (sendNow && createdRecipients) {
      for (const recipient of createdRecipients) {
        if (recipient.role !== "cc") {
          const token = generateSigningToken()
          await supabase.from("signing_sessions").insert({
            recipient_id: recipient.id,
            document_id: document.id,
            token,
            expires_at: getTokenExpiryDate(7).toISOString(),
          })
        }
      }

      // Log audit event
      await supabase.from("audit_events").insert({
        organization_id: organizationId,
        document_id: document.id,
        event_type: "document.sent",
        actor_user_id: user.id,
        actor_email: user.email,
        metadata: { recipient_count: createdRecipients.length },
      })
    } else {
      // Log draft created
      await supabase.from("audit_events").insert({
        organization_id: organizationId,
        document_id: document.id,
        event_type: "document.created",
        actor_user_id: user.id,
        actor_email: user.email,
      })
    }

    return NextResponse.json({ documentId: document.id })
  } catch (error) {
    console.error("Create document error:", error)
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }
}
