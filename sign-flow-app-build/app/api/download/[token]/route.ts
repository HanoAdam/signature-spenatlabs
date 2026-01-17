import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Get download token and document info
    const { data: downloadToken, error: tokenError } = await supabase
      .from("download_tokens")
      .select(
        `
        *,
        documents (
          id,
          title,
          document_files!inner (
            id,
            url,
            filename,
            file_type
          )
        )
      `
      )
      .eq("token", token)
      .single()

    if (tokenError || !downloadToken) {
      return NextResponse.json({ error: "Invalid download link" }, { status: 404 })
    }

    // Check if token has expired
    if (new Date(downloadToken.expires_at) < new Date()) {
      return NextResponse.json({ error: "Download link has expired" }, { status: 400 })
    }

    const document = downloadToken.documents as any
    const signedFile = document?.document_files?.find((f: { file_type: string }) => f.file_type === "signed")

    if (!signedFile) {
      return NextResponse.json({ error: "Signed document not found" }, { status: 404 })
    }

    // Fetch the PDF file
    const fileResponse = await fetch(signedFile.url)
    if (!fileResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 })
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    const filename = signedFile.filename || `signed-${document.title}.pdf`

    // Mark token as used (optional - you might want to allow multiple downloads)
    // await supabase
    //   .from("download_tokens")
    //   .update({ used_at: new Date().toISOString() })
    //   .eq("id", downloadToken.id)

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
