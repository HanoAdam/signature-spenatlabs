"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText, MoreHorizontal, Eye, Download, Send, Bell, XCircle, CheckCircle2, Clock, User } from "lucide-react"
import { toast } from "sonner"
import type { Document, Recipient, DocumentFile } from "@/lib/types"

interface DocumentWithRelations extends Document {
  recipients?: Recipient[]
  document_files?: DocumentFile[]
}

interface RecentDocumentsProps {
  documents: DocumentWithRelations[]
}

export function RecentDocuments({ documents }: RecentDocumentsProps) {
  const router = useRouter()
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithRelations | null>(null)
  const [isSignerStatusOpen, setIsSignerStatusOpen] = useState(false)
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "pending":
        return <Badge variant="default" className="bg-warning text-warning-foreground">Pending</Badge>
      case "completed":
        return <Badge variant="default" className="bg-success text-success-foreground">Completed</Badge>
      case "voided":
        return <Badge variant="destructive">Voided</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleDownload = async (documentId: string) => {
    setIsLoading(documentId)
    try {
      const response = await fetch(`/api/documents/${documentId}/download`)
      if (!response.ok) throw new Error("Failed to download")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = response.headers.get("Content-Disposition")?.split('filename="')[1]?.replace(/"/g, "") || "document.pdf"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Document downloaded successfully")
    } catch (error) {
      toast.error("Failed to download document")
    } finally {
      setIsLoading(null)
    }
  }

  const handleRemind = async (documentId: string, recipientId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId }),
      })

      if (!response.ok) throw new Error("Failed to send reminder")

      toast.success("Reminder sent successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to send reminder")
    }
  }

  const handleVoid = async (documentId: string) => {
    setIsLoading(documentId)
    try {
      const response = await fetch(`/api/documents/${documentId}/void`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to void document")

      toast.success("Document voided")
      setIsVoidDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to void document")
    } finally {
      setIsLoading(null)
    }
  }

  const pendingRecipients = (doc: DocumentWithRelations) => {
    return doc.recipients?.filter((r) => r.status === "pending" || r.status === "sent") || []
  }

  const signedRecipients = (doc: DocumentWithRelations) => {
    return doc.recipients?.filter((r) => r.status === "signed") || []
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>Your latest document activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No documents yet</p>
            <p className="text-xs text-muted-foreground">Create your first document to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>Your latest document activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-start justify-between gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Link href={`/documents/${doc.id}`} className="font-medium hover:underline truncate">
                      {doc.title}
                    </Link>
                    {getStatusBadge(doc.status)}
                  </div>
                  <p className="text-xs text-muted-foreground ml-7 mb-2">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                  {doc.recipients && doc.recipients.length > 0 && (
                    <div className="ml-7 flex items-center gap-4 text-xs text-muted-foreground">
                      <button
                        onClick={() => {
                          setSelectedDocument(doc)
                          setIsSignerStatusOpen(true)
                        }}
                        className="hover:text-foreground underline"
                      >
                        {signedRecipients(doc).length} signed, {pendingRecipients(doc).length} pending
                      </button>
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href={`/documents/${doc.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(doc.id)} disabled={isLoading === doc.id}>
                      <Download className="mr-2 h-4 w-4" />
                      {isLoading === doc.id ? "Downloading..." : "Download"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {doc.status === "draft" && (
                      <DropdownMenuItem asChild>
                        <Link href={`/documents/${doc.id}`}>
                          <Send className="mr-2 h-4 w-4" />
                          Send for Signature
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {doc.status === "pending" && pendingRecipients(doc).length > 0 && (
                      <>
                        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                          Send Reminders
                        </DropdownMenuItem>
                        {pendingRecipients(doc).map((recipient) => (
                          <DropdownMenuItem
                            key={recipient.id}
                            onClick={() => handleRemind(doc.id, recipient.id)}
                          >
                            <Bell className="mr-2 h-4 w-4" />
                            {recipient.name || recipient.email}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {(doc.status === "draft" || doc.status === "pending") && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setSelectedDocument(doc)
                          setIsVoidDialogOpen(true)
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Void Document
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Signer Status Dialog */}
      <Dialog open={isSignerStatusOpen} onOpenChange={setIsSignerStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signer Status</DialogTitle>
            <DialogDescription>
              {selectedDocument?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedDocument?.recipients && selectedDocument.recipients.length > 0 ? (
              <div className="space-y-3">
                {selectedDocument.recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {recipient.status === "signed" ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{recipient.name || "No name"}</p>
                        <p className="text-xs text-muted-foreground">{recipient.email}</p>
                      </div>
                      <Badge variant="outline" className="capitalize ml-2">
                        {recipient.role}
                      </Badge>
                    </div>
                    <div className="text-right">
                      {recipient.status === "signed" ? (
                        <div className="text-xs text-muted-foreground">
                          <p>Signed</p>
                          {recipient.signed_at && (
                            <p className="text-xs">{new Date(recipient.signed_at).toLocaleDateString()}</p>
                          )}
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {recipient.status === "pending" ? "Pending" : recipient.status === "sent" ? "Sent" : recipient.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recipients found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Void Dialog */}
      <AlertDialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void "{selectedDocument?.title}"? This action cannot be undone. All pending
              signatures will be cancelled and recipients will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedDocument && handleVoid(selectedDocument.id)}
              disabled={selectedDocument ? isLoading === selectedDocument.id : false}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {selectedDocument && isLoading === selectedDocument.id ? "Voiding..." : "Void Document"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
