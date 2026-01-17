import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's organization
    const { data: userProfile } = await supabase.from("users").select("organization_id").eq("id", user.id).single()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Get document with files
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*, document_files(*)")
      .eq("id", id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Verify user has access to this document (same organization)
    if (document.organization_id !== userProfile.organization_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Determine which file to download
    // Prefer signed file if available, otherwise use original
    const signedFile = document.document_files?.find((f: { file_type: string }) => f.file_type === "signed")
    const originalFile = document.document_files?.find((f: { file_type: string }) => f.file_type === "original")

    const fileToDownload = signedFile || originalFile

    if (!fileToDownload) {
      return NextResponse.json({ error: "Document file not found" }, { status: 404 })
    }

    // Fetch the PDF file
    const fileResponse = await fetch(fileToDownload.url)
    if (!fileResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 })
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    const filename = fileToDownload.filename || `${document.title}.pdf`

    // Log download audit event
    await supabase.from("audit_events").insert({
      organization_id: document.organization_id,
      document_id: id,
      event_type: "document.downloaded",
      actor_user_id: user.id,
      actor_email: user.email,
      metadata: { file_type: fileToDownload.file_type },
    })

    // Return the file with proper headers to trigger download
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Failed to download document" }, { status: 500 })
  }
}
