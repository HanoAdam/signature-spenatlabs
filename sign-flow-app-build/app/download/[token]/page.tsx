import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function DownloadPage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Configuration Error</CardTitle>
            <CardDescription>Server configuration error. Please contact support.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
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

  if (tokenError) {
    console.error("Download token error:", tokenError)
    // Check if it's a table doesn't exist error
    if (tokenError.message?.includes("relation") || tokenError.message?.includes("does not exist")) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Database Error</CardTitle>
              <CardDescription>
                The download system is not properly configured. Please contact support.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )
    }
    notFound()
  }

  if (!downloadToken) {
    notFound()
  }

  // Check if token has expired
  if (new Date(downloadToken.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Link Expired</CardTitle>
            <CardDescription>This download link has expired. Please contact the sender for a new link.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const document = downloadToken.documents as any
  const signedFile = document?.document_files?.find((f: { file_type: string }) => f.file_type === "signed")

  if (!signedFile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Document Not Found</CardTitle>
            <CardDescription>The signed document is not available.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Mark token as used (optional - you might want to allow multiple downloads)
  // await supabase
  //   .from("download_tokens")
  //   .update({ used_at: new Date().toISOString() })
  //   .eq("id", downloadToken.id)

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Document Ready</CardTitle>
          <CardDescription>Your signed document is ready to download</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Document Title</p>
            <p className="font-semibold text-lg">{document.title}</p>
          </div>

          <Button asChild className="w-full" size="lg">
            <a href={`/api/download/${token}`} download>
              <Download className="mr-2 h-5 w-5" />
              Download Signed Document
            </a>
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This link will remain valid for 90 days.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
