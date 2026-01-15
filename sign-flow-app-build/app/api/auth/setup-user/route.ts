import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, email, fullName, organizationName } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[v0] Missing Supabase service role credentials")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("*, organizations(*)").eq("id", userId).single()

    if (existingUser) {
      return NextResponse.json({ user: existingUser })
    }

    // Create organization first
    const orgName = organizationName || `${email.split("@")[0]}'s Organization`
    const orgSlug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    const { data: newOrg, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: orgName,
        slug: orgSlug,
      })
      .select()
      .single()

    if (orgError) {
      console.error("[v0] Org creation error:", orgError.message)
      return NextResponse.json({ error: `Failed to create organization: ${orgError.message}` }, { status: 500 })
    }

    // Create user profile
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        id: userId,
        email: email,
        full_name: fullName || email.split("@")[0] || "User",
        organization_id: newOrg.id,
        role: "admin",
      })
      .select("*, organizations(*)")
      .single()

    if (userError) {
      console.error("[v0] User creation error:", userError.message)
      // Clean up the org we just created
      await supabase.from("organizations").delete().eq("id", newOrg.id)
      return NextResponse.json({ error: `Failed to create user: ${userError.message}` }, { status: 500 })
    }

    return NextResponse.json({ user: newUser })
  } catch (error) {
    console.error("[v0] Setup user error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
