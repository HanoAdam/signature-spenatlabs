import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface EmailAttachment {
  filename: string
  content: string // Base64 encoded content
}

interface EmailTemplate {
  to: string
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

export async function sendEmail(template: EmailTemplate): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log("[v0] RESEND_API_KEY not configured. Email would be sent to:", template.to)
    console.log("[v0] Subject:", template.subject)
    if (template.attachments) {
      console.log("[v0] Attachments:", template.attachments.map(a => a.filename).join(", "))
    }
    return { success: true }
  }

  try {
    const emailPayload: any = {
      from: "SignFlow <noreply@signature.spenatlabs.com>",
      to: template.to,
      subject: template.subject,
      html: template.html,
    }

    // Add attachments if provided
    if (template.attachments && template.attachments.length > 0) {
      emailPayload.attachments = template.attachments.map(att => ({
        filename: att.filename,
        content: att.content,
      }))
    }

    const { error } = await resend.emails.send(emailPayload)

    if (error) {
      console.error("[v0] Resend error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error("[v0] Failed to send email:", err)
    return { success: false, error: "Failed to send email" }
  }
}

interface SignatureRequestParams {
  recipientName: string
  recipientEmail: string
  documentTitle: string
  senderName: string
  signingUrl: string
}

export function generateSignatureRequestEmail(params: SignatureRequestParams): EmailTemplate {
  const { recipientName, recipientEmail, documentTitle, senderName, signingUrl } = params

  return {
    to: recipientEmail,
    subject: `${senderName} has requested your signature on "${documentTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #18181b; font-size: 24px; margin: 0;">SignFlow</h1>
              </div>
              
              <h2 style="color: #18181b; font-size: 20px; margin: 0 0 16px 0;">
                Hello ${recipientName},
              </h2>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                <strong>${senderName}</strong> has requested your signature on the document:
              </p>
              
              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #18181b; font-size: 16px; font-weight: 600; margin: 0;">
                  ${documentTitle}
                </p>
              </div>
              
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${signingUrl}" style="display: inline-block; background-color: #18181b; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Review &amp; Sign Document
                </a>
              </div>
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 0;">
                This link will expire in 7 days. If you have any questions, please contact the sender directly.
              </p>
            </div>
            
            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
              Powered by SignFlow
            </p>
          </div>
        </body>
      </html>
    `,
  }
}

interface ReminderParams {
  recipientName: string
  recipientEmail: string
  documentTitle: string
  senderName: string
  signingUrl: string
}

export function generateReminderEmail(params: ReminderParams): EmailTemplate {
  const { recipientName, recipientEmail, documentTitle, senderName, signingUrl } = params

  return {
    to: recipientEmail,
    subject: `Reminder: Your signature is needed on "${documentTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #18181b; font-size: 24px; margin: 0;">SignFlow</h1>
              </div>
              
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
                <p style="color: #92400e; font-size: 14px; font-weight: 500; margin: 0;">
                  ⏰ Reminder
                </p>
              </div>
              
              <h2 style="color: #18181b; font-size: 20px; margin: 0 0 16px 0;">
                Hello ${recipientName},
              </h2>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                This is a friendly reminder that <strong>${senderName}</strong> is waiting for your signature on:
              </p>
              
              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #18181b; font-size: 16px; font-weight: 600; margin: 0;">
                  ${documentTitle}
                </p>
              </div>
              
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${signingUrl}" style="display: inline-block; background-color: #18181b; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Review &amp; Sign Now
                </a>
              </div>
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 0;">
                If you've already signed this document, please disregard this email.
              </p>
            </div>
            
            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
              Powered by SignFlow
            </p>
          </div>
        </body>
      </html>
    `,
  }
}

interface CompletionParams {
  recipientName: string
  recipientEmail: string
  documentTitle: string
  downloadUrl?: string
  attachment?: EmailAttachment
  attachmentSize?: number // Size in bytes
}

const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024 // 8MB in bytes

export function generateCompletionEmail(params: CompletionParams): EmailTemplate {
  const { recipientName, recipientEmail, documentTitle, downloadUrl, attachment, attachmentSize } = params

  // Only include attachment if it exists and is under 8MB
  const shouldAttach = attachment && attachmentSize !== undefined && attachmentSize < MAX_ATTACHMENT_SIZE

  return {
    to: recipientEmail,
    subject: `"${documentTitle}" has been completed`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #18181b; font-size: 24px; margin: 0;">SignFlow</h1>
              </div>
              
              <div style="background-color: #dcfce7; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
                <p style="color: #166534; font-size: 14px; font-weight: 500; margin: 0;">
                  ✓ Document Completed
                </p>
              </div>
              
              <h2 style="color: #18181b; font-size: 20px; margin: 0 0 16px 0;">
                Hello ${recipientName},
              </h2>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Great news! All parties have signed the following document:
              </p>
              
              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #18181b; font-size: 16px; font-weight: 600; margin: 0;">
                  ${documentTitle}
                </p>
              </div>
              
              ${
                shouldAttach
                  ? `
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                The signed document is attached to this email.
              </p>
              `
                  : ""
              }
              
              ${
                downloadUrl
                  ? `
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${downloadUrl}" style="display: inline-block; background-color: #18181b; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  ${shouldAttach ? "Download Additional Copy" : "Download Signed Document"}
                </a>
              </div>
              `
                  : ""
              }
              
              ${
                attachmentSize && attachmentSize >= MAX_ATTACHMENT_SIZE
                  ? `
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                Note: The document is too large to attach. Please use the download link above.
              </p>
              `
                  : ""
              }
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 0;">
                A copy of the signed document has been saved to your account.
              </p>
            </div>
            
            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
              Powered by SignFlow
            </p>
          </div>
        </body>
      </html>
    `,
    attachments: shouldAttach && attachment ? [attachment] : undefined,
  }
}
