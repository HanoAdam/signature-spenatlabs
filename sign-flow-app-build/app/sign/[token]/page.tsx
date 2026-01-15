import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { SigningRoom } from "@/components/signing/signing-room"

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function SigningPage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()

  // Get signing session with all related data
  const { data: session, error } = await supabase
    .from("signing_sessions")
    .select(
      `
      *,
      recipients (*),
      documents (
        *,
        document_files (*),
        fields (*),
        recipients (*)
      )
    `,
    )
    .eq("token", token)
    .single()

  if (error || !session) {
    notFound()
  }

  // Check if token is expired
  if (new Date(session.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-2">Link Expired</h1>
          <p className="text-muted-foreground">
            This signing link has expired. Please contact the sender for a new link.
          </p>
        </div>
      </div>
    )
  }

  // Check if already signed
  if (session.recipients.status === "signed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-2">Already Signed</h1>
          <p className="text-muted-foreground">You have already signed this document. Thank you!</p>
        </div>
      </div>
    )
  }

  // Check if document is voided
  if (session.documents.status === "voided") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-2">Document Voided</h1>
          <p className="text-muted-foreground">This document has been voided and is no longer available for signing.</p>
        </div>
      </div>
    )
  }

  const originalFile = session.documents.document_files?.find((f: { file_type: string }) => f.file_type === "original")
  const recipientFields = session.documents.fields?.filter(
    (f: { recipient_id: string }) => f.recipient_id === session.recipient_id,
  )

  return (
    <SigningRoom
      session={session}
      document={session.documents}
      recipient={session.recipients}
      pdfUrl={originalFile?.url}
      fields={recipientFields || []}
      allRecipients={session.documents.recipients || []}
    />
  )
}
