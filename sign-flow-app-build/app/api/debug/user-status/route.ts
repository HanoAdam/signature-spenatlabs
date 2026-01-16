import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ 
        authenticated: false,
        error: authError?.message || "No user found"
      })
    }

    // Check with regular client (RLS applies)
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*, organizations(*)")
      .eq("id", user.id)
      .single()

    // Check with service client (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    let serviceProfile = null
    let serviceError = null
    
    if (supabaseUrl && supabaseServiceKey) {
      const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      
      const { data, error } = await serviceClient
        .from("users")
        .select("*, organizations(*)")
        .eq("id", user.id)
        .single()
      
      serviceProfile = data
      serviceError = error
    }

    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      email: user.email,
      userMetadata: user.user_metadata,
      profileWithRLS: {
        exists: !!userProfile,
        data: userProfile,
        error: profileError?.message,
        code: profileError?.code,
      },
      profileWithoutRLS: {
        exists: !!serviceProfile,
        data: serviceProfile,
        error: serviceError?.message,
        code: serviceError?.code,
      },
      serviceClientAvailable: !!supabaseServiceKey,
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
