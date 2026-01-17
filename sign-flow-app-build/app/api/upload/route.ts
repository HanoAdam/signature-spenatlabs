import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PDFDocument } from "pdf-lib"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    // Read file as array buffer once (can only be read once)
    const arrayBuffer = await file.arrayBuffer()
    
    // Count pages from the PDF
    let pageCount = 1
    try {
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
      pageCount = pdfDoc.getPageCount()
    } catch (pdfError) {
      console.warn("Failed to count PDF pages, defaulting to 1:", pdfError)
      // Continue with default page count of 1
    }

    // Upload to Vercel Blob using the same buffer
    const blob = await put(`documents/${user.id}/${Date.now()}-${file.name}`, arrayBuffer, {
      access: "public",
      contentType: "application/pdf",
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      pageCount,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
