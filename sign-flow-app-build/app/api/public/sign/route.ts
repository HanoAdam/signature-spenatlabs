import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { generateCompletionEmail, sendEmail } from "@/lib/utils/email"

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

      // Get all recipients (including CC) and signed file URL for completion emails
      const { data: allRecipientsData } = await supabase
        .from("recipients")
        .select("*")
        .eq("document_id", session.document_id)

      // Get document creator (sender)
      const { data: documentData } = await supabase
        .from("documents")
        .select("created_by")
        .eq("id", session.document_id)
        .single()

      // Get sender user info
      let senderInfo: { email: string; name: string } | null = null
      if (documentData?.created_by) {
        const { data: senderData } = await supabase
          .from("users")
          .select("email, full_name")
          .eq("id", documentData.created_by)
          .single()
        
        if (senderData) {
          senderInfo = {
            email: senderData.email,
            name: senderData.full_name || senderData.email || "Document Creator",
          }
        }
      }

      // Get signed document file
      const { data: documentFiles } = await supabase
        .from("document_files")
        .select("url, filename, size_bytes")
        .eq("document_id", session.document_id)
        .eq("file_type", "signed")
        .single()

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://signature.spenatlabs.com"
      const downloadUrl = documentFiles?.url || undefined
      const fileSize = documentFiles?.size_bytes || undefined

      // Download PDF file for attachment (if URL exists and size is < 8MB)
      let pdfAttachment: { filename: string; content: string } | undefined = undefined
      let actualFileSize: number | undefined = fileSize
      const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024 // 8MB

      if (downloadUrl) {
        try {
          // If size is not known, download to check size
          if (!fileSize) {
            console.log("File size not known, downloading to check size:", downloadUrl)
            const headResponse = await fetch(downloadUrl, { method: "HEAD" })
            const contentLength = headResponse.headers.get("content-length")
            if (contentLength) {
              actualFileSize = parseInt(contentLength, 10)
              console.log("File size determined from HEAD request:", actualFileSize, "bytes")
            }
          }

          // Download file if size is acceptable
          if (!actualFileSize || actualFileSize < MAX_ATTACHMENT_SIZE) {
            console.log("Downloading PDF for attachment:", downloadUrl)
            const response = await fetch(downloadUrl)
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer()
              const buffer = Buffer.from(arrayBuffer)
              const downloadedSize = buffer.length
              
              // Use actual downloaded size if we didn't know it before
              if (!actualFileSize) {
                actualFileSize = downloadedSize
              }

              // Only attach if still under limit
              if (downloadedSize < MAX_ATTACHMENT_SIZE) {
                const base64Content = buffer.toString("base64")
                
                // Sanitize filename - ensure it ends with .pdf
                let filename = documentFiles.filename || `signed-${session.documents.title}.pdf`
                if (!filename.toLowerCase().endsWith('.pdf')) {
                  filename = filename + '.pdf'
                }
                // Remove any potentially problematic characters
                filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
                
                pdfAttachment = {
                  filename: filename,
                  content: base64Content,
                }
                console.log("PDF downloaded successfully for attachment, size:", downloadedSize, "bytes")
              } else {
                console.log("PDF file is too large for attachment (", downloadedSize, "bytes), will send download link only")
                actualFileSize = downloadedSize
              }
            } else {
              console.warn("Failed to download PDF for attachment, status:", response.status)
            }
          } else {
            console.log("PDF file is too large for attachment (", actualFileSize, "bytes), will send download link only")
          }
        } catch (downloadError) {
          console.error("Error downloading PDF for attachment:", downloadError)
          // Continue without attachment - will send download link only
        }
      }

      // Collect all email recipients (recipients + sender)
      const emailRecipients: Array<{ email: string; name: string; id?: string }> = []

      // Add all recipients
      if (allRecipientsData && allRecipientsData.length > 0) {
        for (const recipient of allRecipientsData) {
          emailRecipients.push({
            email: recipient.email,
            name: recipient.name || recipient.email,
            id: recipient.id,
          })
        }
      }

      // Add sender if they're not already in the recipients list
      if (senderInfo) {
        const senderAlreadyIncluded = emailRecipients.some(r => r.email === senderInfo!.email)
        if (!senderAlreadyIncluded) {
          emailRecipients.push({
            email: senderInfo.email,
            name: senderInfo.name,
          })
        }
      }

      // Send completion emails to all recipients (including sender)
      if (emailRecipients.length > 0) {
        for (const recipient of emailRecipients) {
          try {
            const emailTemplate = generateCompletionEmail({
              recipientName: recipient.name || recipient.email,
              recipientEmail: recipient.email,
              documentTitle: session.documents.title,
              downloadUrl: downloadUrl,
              attachment: pdfAttachment,
              attachmentSize: actualFileSize,
            })

            console.log("Sending completion email to:", recipient.email, "for document:", session.document_id)
            const emailResult = await sendEmail(emailTemplate)

            if (!emailResult.success) {
              console.error("Failed to send completion email to", recipient.email, ":", emailResult.error)
              // Don't throw - continue with other recipients even if one email fails
            } else {
              console.log("Completion email sent successfully to:", recipient.email, pdfAttachment ? "with attachment" : "with download link only")
            }

            // Log email sent audit event (only for actual recipients, not sender)
            if (recipient.id) {
              await supabase.from("audit_events").insert({
                organization_id: session.documents.organization_id,
                document_id: session.document_id,
                event_type: "recipient.completion_email_sent",
                actor_email: recipient.email,
                recipient_id: recipient.id,
                metadata: { recipient_email: recipient.email, has_attachment: !!pdfAttachment },
              })
            } else {
              // Log for sender
              await supabase.from("audit_events").insert({
                organization_id: session.documents.organization_id,
                document_id: session.document_id,
                event_type: "document.completion_email_sent",
                actor_email: recipient.email,
                metadata: { recipient_email: recipient.email, recipient_type: "sender", has_attachment: !!pdfAttachment },
              })
            }
          } catch (emailError) {
            console.error("Error sending completion email to", recipient.email, ":", emailError)
            // Continue with other recipients
          }
        }
      }
    }

    return NextResponse.json({ success: true, documentCompleted: allSigned })
  } catch (error) {
    console.error("Signing error:", error)
    return NextResponse.json({ error: "Failed to process signature" }, { status: 500 })
  }
}
