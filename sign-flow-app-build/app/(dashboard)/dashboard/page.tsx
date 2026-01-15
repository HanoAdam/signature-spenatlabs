import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, CheckCircle2, Send, XCircle } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Get user's organization
  const { data: userProfile } = await supabase.from("users").select("organization_id").eq("id", user.id).single()

  if (!userProfile) return null

  // Fetch document stats
  const { data: documents } = await supabase
    .from("documents")
    .select("id, status, created_at, title")
    .eq("organization_id", userProfile.organization_id)
    .order("created_at", { ascending: false })
    .limit(10)

  const stats = {
    total: documents?.length || 0,
    draft: documents?.filter((d) => d.status === "draft").length || 0,
    pending: documents?.filter((d) => d.status === "pending").length || 0,
    completed: documents?.filter((d) => d.status === "completed").length || 0,
    voided: documents?.filter((d) => d.status === "voided").length || 0,
  }

  const recentDocuments = documents?.slice(0, 5) || []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "pending":
        return (
          <Badge variant="default" className="bg-warning text-warning-foreground">
            Pending
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default" className="bg-success text-success-foreground">
            Completed
          </Badge>
        )
      case "voided":
        return <Badge variant="destructive">Voided</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your document signing activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Send className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting signatures</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Successfully signed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">Not yet sent</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>Your latest document activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No documents yet</p>
                <p className="text-xs text-muted-foreground">Create your first document to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium leading-none">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <a
                href="/documents/new"
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">New Document</p>
                  <p className="text-xs text-muted-foreground">Upload a PDF and add signers</p>
                </div>
              </a>
              <a
                href="/templates"
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <XCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Templates</p>
                  <p className="text-xs text-muted-foreground">Manage reusable document templates</p>
                </div>
              </a>
              <a
                href="/contacts"
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Contacts</p>
                  <p className="text-xs text-muted-foreground">Manage your signing contacts</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
