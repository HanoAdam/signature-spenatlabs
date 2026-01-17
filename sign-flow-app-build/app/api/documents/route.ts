import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateSigningToken, getTokenExpiryDate } from "@/lib/utils/tokens"
import { generateSignatureRequestEmail, sendEmail } from "@/lib/utils/email"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      return NextResponse.json(
        { error: "Invalid JSON in request body", message: parseError instanceof Error ? parseError.message : "Parse error" },
        { status: 400 },
      )
    }

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

    // Validate required fields
    if (!title || !pdfUrl || !pdfFilename || !organizationId) {
      console.error("Missing required fields:", { title: !!title, pdfUrl: !!pdfUrl, pdfFilename: !!pdfFilename, organizationId: !!organizationId })
      return NextResponse.json(
        { error: "Missing required fields", message: "title, pdfUrl, pdfFilename, and organizationId are required" },
        { status: 400 },
      )
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      console.error("Invalid recipients:", recipients)
      return NextResponse.json(
        { error: "Invalid recipients", message: "At least one recipient is required" },
        { status: 400 },
      )
    }

    // Create document
    console.log("Creating document with:", { organizationId, userId: user.id, title, status: sendNow ? "pending" : "draft" })
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        organization_id: organizationId,
        created_by: user.id,
        title,
        description: description || null,
        status: sendNow ? "pending" : "draft",
        signing_order: signingOrder || "parallel",
        template_id: templateId || null,
      })
      .select()
      .single()

    if (docError) {
      console.error("Document creation error:", docError)
      throw docError
    }
    console.log("Document created successfully:", document?.id)

    // Create document file
    console.log("Creating document file for document:", document.id)
    const { error: fileError } = await supabase.from("document_files").insert({
      document_id: document.id,
      file_type: "original",
      url: pdfUrl,
      filename: pdfFilename,
      page_count: pageCount,
    })

    if (fileError) {
      console.error("Document file creation error:", fileError)
      throw fileError
    }
    console.log("Document file created successfully")

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

    console.log("Creating recipients:", recipientInserts.length)
    const { data: createdRecipients, error: recipError } = await supabase
      .from("recipients")
      .insert(recipientInserts)
      .select()

    if (recipError) {
      console.error("Recipients creation error:", recipError)
      throw recipError
    }
    console.log("Recipients created successfully:", createdRecipients?.length)

    // Create fields with actual recipient IDs
    if (fields && Array.isArray(fields) && fields.length > 0 && createdRecipients && createdRecipients.length > 0) {
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
          if (recipientId && typeof recipientId === "string" && recipientId.startsWith("temp-")) {
            const tempIndex = Number.parseInt(recipientId.replace("temp-", ""))
            recipientId = createdRecipients[tempIndex]?.id || createdRecipients[0]?.id
          }
          if (!recipientId) {
            throw new Error(`Invalid recipient_id for field: ${JSON.stringify(f)}`)
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
            required: f.required ?? true,
          }
        },
      )

      const { error: fieldError } = await supabase.from("fields").insert(fieldInserts)
      if (fieldError) throw fieldError
    }

    // If sending now, create signing sessions and send emails
    if (sendNow && createdRecipients) {
      // Get sender profile for email
      const { data: senderProfile } = await supabase
        .from("users")
        .select("full_name, email")
        .eq("id", user.id)
        .single()

      const senderName = senderProfile?.full_name || senderProfile?.email || user.email || "Someone"
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://signature.spenatlabs.com"

      for (const recipient of createdRecipients) {
        if (recipient.role !== "cc") {
          const token = generateSigningToken()
          const { error: sessionError } = await supabase.from("signing_sessions").insert({
            recipient_id: recipient.id,
            document_id: document.id,
            token,
            expires_at: getTokenExpiryDate(7).toISOString(),
          })
          if (sessionError) {
            console.error("Signing session creation error:", sessionError)
            throw sessionError
          }

          // Send email to recipient
          const signingUrl = `${baseUrl}/sign/${token}`
          const emailTemplate = generateSignatureRequestEmail({
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            documentTitle: title,
            senderName,
            signingUrl,
          })

          console.log("Sending email to:", recipient.email, "for document:", document.id)
          const emailResult = await sendEmail(emailTemplate)
          
          if (!emailResult.success) {
            console.error("Failed to send email to", recipient.email, ":", emailResult.error)
            // Don't throw - continue with other recipients even if one email fails
          } else {
            console.log("Email sent successfully to:", recipient.email)
          }

          // Log email sent audit event
          await supabase.from("audit_events").insert({
            organization_id: organizationId,
            document_id: document.id,
            event_type: "recipient.email_sent",
            actor_user_id: user.id,
            actor_email: user.email,
            recipient_id: recipient.id,
            metadata: { recipient_email: recipient.email, email_success: emailResult.success },
          })
        }
      }

      // Log audit event
      const { error: auditError } = await supabase.from("audit_events").insert({
        organization_id: organizationId,
        document_id: document.id,
        event_type: "document.sent",
        actor_user_id: user.id,
        actor_email: user.email,
        metadata: { recipient_count: createdRecipients.length },
      })
      if (auditError) throw auditError
    } else {
      // Log draft created
      const { error: auditError } = await supabase.from("audit_events").insert({
        organization_id: organizationId,
        document_id: document.id,
        event_type: "document.created",
        actor_user_id: user.id,
        actor_email: user.email,
      })
      if (auditError) throw auditError
    }

    return NextResponse.json({ documentId: document.id })
  } catch (error) {
    console.error("Create document error:", error)
    console.error("Error type:", typeof error)
    console.error("Error keys:", error && typeof error === "object" ? Object.keys(error) : "N/A")
    
    // Handle Supabase errors (they're objects, not Error instances)
    let errorMessage = "Failed to create document"
    let errorCode: string | undefined
    let errorDetails: any
    let errorHint: string | undefined
    
    if (error && typeof error === "object") {
      // Supabase error structure
      if ("message" in error && typeof error.message === "string") {
        errorMessage = error.message
      }
      if ("code" in error) {
        errorCode = String(error.code)
      }
      if ("details" in error) {
        errorDetails = error.details
      }
      if ("hint" in error && typeof error.hint === "string") {
        errorHint = error.hint
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    
    // Log full error for debugging
    console.error("Full error object:", JSON.stringify(error, null, 2))
    
    return NextResponse.json(
      {
        error: "Failed to create document",
        message: errorMessage,
        code: errorCode,
        details: errorDetails,
        hint: errorHint,
        rawError: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    )
  }
}
