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

    const { fullName } = await request.json()

    const { error } = await supabase
      .from("users")
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq("id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
