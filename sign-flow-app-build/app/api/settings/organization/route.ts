import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: Request) {
  try {
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
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { name, settings } = await request.json()

    const { error } = await supabase
      .from("organizations")
      .update({ name, settings, updated_at: new Date().toISOString() })
      .eq("id", userProfile.organization_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update organization error:", error)
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
  }
}
