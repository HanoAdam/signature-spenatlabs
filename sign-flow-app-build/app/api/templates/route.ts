import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    const { name, description, fileUrl, filename, pageCount, fields, organizationId } = body

    // Create template
    const { data: template, error: templateError } = await supabase
      .from("templates")
      .insert({
        organization_id: organizationId,
        created_by: user.id,
        name,
        description,
        file_url: fileUrl,
        filename,
        page_count: pageCount,
      })
      .select()
      .single()

    if (templateError) throw templateError

    // Create template fields
    if (fields.length > 0) {
      const fieldInserts = fields.map(
        (f: {
          type: string
          page: number
          x: number
          y: number
          width: number
          height: number
          required: boolean
          recipient_role: string
          recipient_order: number
        }) => ({
          template_id: template.id,
          type: f.type,
          page: f.page,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          required: f.required,
          recipient_role: f.recipient_role,
          recipient_order: f.recipient_order,
        }),
      )

      await supabase.from("template_fields").insert(fieldInserts)
    }

    return NextResponse.json({ templateId: template.id })
  } catch (error) {
    console.error("Create template error:", error)
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}
