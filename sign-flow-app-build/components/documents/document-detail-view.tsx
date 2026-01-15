"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Document, Page, pdfjs } from "react-pdf"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  Send,
  Download,
  XCircle,
  Clock,
  CheckCircle2,
  Eye,
  LinkIcon,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { DocumentWithRelations, AuditEvent, SigningSession } from "@/lib/types"
import Link from "next/link"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface DocumentDetailViewProps {
  document: DocumentWithRelations & { signing_sessions?: SigningSession[] }
  auditEvents: AuditEvent[]
}

export function DocumentDetailView({ document, auditEvents }: DocumentDetailViewProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(1)
  const [isVoiding, setIsVoiding] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const originalFile = document.files?.find((f) => f.file_type === "original")
  const signedFile = document.files?.find((f) => f.file_type === "signed")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "pending":
        return <Badge className="bg-warning text-warning-foreground">Pending</Badge>
      case "completed":
        return <Badge className="bg-success text-success-foreground">Completed</Badge>
      case "voided":
        return <Badge variant="destructive">Voided</Badge>
      case "expired":
        return <Badge variant="outline">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRecipientStatusIcon = (status: string) => {
    switch (status) {
      case "signed":
        return <CheckCircle2 className="h-4 w-4 text-success" />
      case "viewed":
        return <Eye className="h-4 w-4 text-info" />
      case "sent":
        return <Send className="h-4 w-4 text-warning" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const handleSend = async () => {
    setIsSending(true)
    try {
      const response = await fetch(`/api/documents/${document.id}/send`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to send")
      toast.success("Document sent for signing")
      router.refresh()
    } catch {
      toast.error("Failed to send document")
    } finally {
      setIsSending(false)
    }
  }

  const handleVoid = async () => {
    setIsVoiding(true)
    try {
      const response = await fetch(`/api/documents/${document.id}/void`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to void")
      toast.success("Document voided")
      router.refresh()
    } catch {
      toast.error("Failed to void document")
    } finally {
      setIsVoiding(false)
    }
  }

  const copySigningLink = (recipientId: string) => {
    const session = document.signing_sessions?.find((s) => s.recipient_id === recipientId)
    if (session) {
      navigator.clipboard.writeText(`${window.location.origin}/sign/${session.token}`)
      toast.success("Signing link copied to clipboard")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/documents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{document.title}</h1>
            {getStatusBadge(document.status)}
          </div>
          {document.description && <p className="text-muted-foreground">{document.description}</p>}
        </div>
        <div className="flex gap-2">
          {document.status === "draft" && (
            <Button onClick={handleSend} disabled={isSending}>
              <Send className="mr-2 h-4 w-4" />
              {isSending ? "Sending..." : "Send for Signing"}
            </Button>
          )}
          {document.status === "pending" && (
            <Button variant="outline" onClick={handleSend} disabled={isSending}>
              <Send className="mr-2 h-4 w-4" />
              Send Reminder
            </Button>
          )}
          {(signedFile || originalFile) && (
            <Button variant="outline" asChild>
              <a href={signedFile?.url || originalFile?.url} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          )}
          {document.status !== "voided" && document.status !== "completed" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive bg-transparent">
                  <XCircle className="mr-2 h-4 w-4" />
                  Void
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Void this document?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel the document and invalidate all signing links. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleVoid}
                    disabled={isVoiding}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isVoiding ? "Voiding..." : "Void Document"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="document">Document</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recipients</CardTitle>
                <CardDescription>People who need to sign or view this document</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {document.recipients?.map((recipient) => (
                    <div key={recipient.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getRecipientStatusIcon(recipient.status)}
                        <div>
                          <p className="text-sm font-medium">{recipient.name}</p>
                          <p className="text-xs text-muted-foreground">{recipient.email}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {recipient.role}
                        </Badge>
                      </div>
                      {document.status === "pending" && recipient.role !== "cc" && (
                        <Button variant="ghost" size="sm" onClick={() => copySigningLink(recipient.id)}>
                          <LinkIcon className="mr-2 h-3 w-3" />
                          Copy Link
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Created</dt>
                    <dd>{new Date(document.created_at).toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Signing Order</dt>
                    <dd className="capitalize">{document.signing_order}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">File</dt>
                    <dd>{originalFile?.filename}</dd>
                  </div>
                  {document.completed_at && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Completed</dt>
                      <dd>{new Date(document.completed_at).toLocaleString()}</dd>
                    </div>
                  )}
                  {document.voided_at && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Voided</dt>
                      <dd>{new Date(document.voided_at).toLocaleString()}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="document">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Document Preview</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {numPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= numPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] border rounded-lg bg-muted/30">
                <div className="p-4 flex justify-center">
                  {originalFile && (
                    <Document
                      file={originalFile.url}
                      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                      loading={<div className="p-8 text-center">Loading PDF...</div>}
                    >
                      <Page pageNumber={currentPage} className="shadow-lg" />
                    </Document>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Trail</CardTitle>
              <CardDescription>Complete history of actions on this document</CardDescription>
            </CardHeader>
            <CardContent>
              {auditEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No audit events yet</p>
              ) : (
                <div className="space-y-4">
                  {auditEvents.map((event) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div className="flex-1 w-px bg-border" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">
                          {event.event_type.replace(".", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.actor_email || "System"} - {new Date(event.created_at).toLocaleString()}
                        </p>
                        {event.ip_address && <p className="text-xs text-muted-foreground">IP: {event.ip_address}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
