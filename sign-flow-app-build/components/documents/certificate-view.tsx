"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Download, FileText, Shield, Clock, User, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface CertificateViewProps {
  document: {
    id: string
    title: string
    status: string
    created_at: string
    completed_at: string
    recipients: Array<{
      id: string
      name: string
      email: string
      signed_at: string
    }>
    audit_events: Array<{
      id: string
      event_type: string
      created_at: string
      ip_address: string
      actor_type: string
      metadata: Record<string, unknown>
    }>
  }
}

export function CertificateView({ document }: CertificateViewProps) {
  const certificateId = `CERT-${document.id.slice(0, 8).toUpperCase()}`

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/documents/${document.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Document
          </Button>
        </Link>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center border-b bg-muted/50">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Certificate of Completion</CardTitle>
          <p className="text-muted-foreground">This document has been electronically signed by all parties</p>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {/* Document Info */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-lg font-medium">
              <FileText className="h-5 w-5" />
              {document.title}
            </div>
            <Badge variant="secondary" className="text-xs">
              {certificateId}
            </Badge>
          </div>

          <Separator />

          {/* Signers */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Signatories
            </h3>
            <div className="grid gap-4">
              {document.recipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{recipient.name}</p>
                      <p className="text-sm text-muted-foreground">{recipient.email}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">Signed on</p>
                    <p className="font-medium">{format(new Date(recipient.signed_at), "PPp")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Audit Trail
            </h3>
            <div className="space-y-3">
              {document.audit_events.map((event, index) => (
                <div key={event.id} className="flex items-start gap-4 text-sm">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="font-medium capitalize">{event.event_type.replace(/\./g, " ").replace(/_/g, " ")}</p>
                    <p className="text-muted-foreground">
                      {format(new Date(event.created_at), "PPp")}
                      {event.ip_address && <span className="ml-2">• IP: {event.ip_address}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Footer */}
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              This certificate was generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
            </p>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download Certificate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
