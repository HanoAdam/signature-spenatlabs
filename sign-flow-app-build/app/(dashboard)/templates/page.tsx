import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TemplatesGrid } from "@/components/templates/templates-grid"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function TemplatesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: userProfile } = await supabase.from("users").select("organization_id").eq("id", user.id).single()

  if (!userProfile) redirect("/auth/login")

  const { data: templates } = await supabase
    .from("templates")
    .select("*, template_fields(count)")
    .eq("organization_id", userProfile.organization_id)
    .order("created_at", { ascending: false })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">Reusable document templates with pre-configured fields</p>
        </div>
        <Button asChild>
          <Link href="/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </div>

      <TemplatesGrid templates={templates || []} />
    </div>
  )
}
