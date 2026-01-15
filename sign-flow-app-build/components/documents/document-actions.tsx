"use client"

import { useState } from "react"
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
import { MoreHorizontal, Send, Bell, XCircle, Download, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DocumentActionsProps {
  documentId: string
  status: string
  recipients?: Array<{
    id: string
    name: string
    email: string
    status: string
  }>
}

export function DocumentActions({ documentId, status, recipients = [] }: DocumentActionsProps) {
  const router = useRouter()
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/send`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to send document")

      toast.success("Document sent for signature")
      router.refresh()
    } catch (error) {
      toast.error("Failed to send document")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemind = async (recipientId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId }),
      })

      if (!response.ok) throw new Error("Failed to send reminder")

      toast.success("Reminder sent successfully")
    } catch (error) {
      toast.error("Failed to send reminder")
    }
  }

  const handleVoid = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/void`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to void document")

      toast.success("Document voided")
      router.refresh()
    } catch (error) {
      toast.error("Failed to void document")
    } finally {
      setIsLoading(false)
      setIsVoidDialogOpen(false)
    }
  }

  const handleCopyLink = (recipientId: string) => {
    const recipient = recipients.find((r) => r.id === recipientId)
    if (recipient) {
      // In production, you'd get the actual signing URL
      const signingUrl = `${window.location.origin}/sign/${recipientId}`
      navigator.clipboard.writeText(signingUrl)
      toast.success("Signing link copied to clipboard")
    }
  }

  const pendingRecipients = recipients.filter((r) => r.status === "pending")

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {status === "draft" && (
            <DropdownMenuItem onClick={handleSend} disabled={isLoading}>
              <Send className="h-4 w-4 mr-2" />
              Send for Signature
            </DropdownMenuItem>
          )}

          {status === "sent" && pendingRecipients.length > 0 && (
            <>
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                Send Reminders
              </DropdownMenuItem>
              {pendingRecipients.map((recipient) => (
                <DropdownMenuItem key={recipient.id} onClick={() => handleRemind(recipient.id)}>
                  <Bell className="h-4 w-4 mr-2" />
                  {recipient.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {status === "completed" && (
            <>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/documents/${documentId}/certificate`)}>
                <Eye className="h-4 w-4 mr-2" />
                View Certificate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {(status === "draft" || status === "sent") && (
            <DropdownMenuItem className="text-destructive" onClick={() => setIsVoidDialogOpen(true)}>
              <XCircle className="h-4 w-4 mr-2" />
              Void Document
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void this document? This action cannot be undone. All pending signatures will be
              cancelled and recipients will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoid}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Voiding..." : "Void Document"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
