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

    const { name, email, company, phone, notes, organizationId } = await request.json()

    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({
        organization_id: organizationId,
        name,
        email,
        company,
        phone,
        notes,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ contact })
  } catch (error) {
    console.error("Create contact error:", error)
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, name, email, company, phone, notes } = await request.json()

    const { data: contact, error } = await supabase
      .from("contacts")
      .update({ name, email, company, phone, notes, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ contact })
  } catch (error) {
    console.error("Update contact error:", error)
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    const { error } = await supabase.from("contacts").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete contact error:", error)
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 })
  }
}
