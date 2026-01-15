"use client"

import type React from "react"

import { formatAuditEvent } from "@/lib/utils/audit"
import { format } from "date-fns"
import { FileText, Send, Eye, PenLine, CheckCircle, XCircle, Mail, Bell, Edit } from "lucide-react"

interface AuditEvent {
  id: string
  event_type: string
  actor_type: string
  created_at: string
  ip_address?: string
  user_agent?: string
  recipient?: { name: string; email: string } | null
  metadata?: Record<string, unknown>
}

interface AuditTimelineProps {
  events: AuditEvent[]
}

const eventIcons: Record<string, React.ReactNode> = {
  "document.created": <FileText className="h-4 w-4" />,
  "document.sent": <Send className="h-4 w-4" />,
  "document.viewed": <Eye className="h-4 w-4" />,
  "document.signed": <PenLine className="h-4 w-4" />,
  "document.completed": <CheckCircle className="h-4 w-4" />,
  "document.voided": <XCircle className="h-4 w-4" />,
  "document.declined": <XCircle className="h-4 w-4" />,
  "recipient.email_sent": <Mail className="h-4 w-4" />,
  "recipient.reminder_sent": <Bell className="h-4 w-4" />,
  "field.updated": <Edit className="h-4 w-4" />,
}

const eventColors: Record<string, string> = {
  "document.created": "bg-blue-100 text-blue-600",
  "document.sent": "bg-purple-100 text-purple-600",
  "document.viewed": "bg-gray-100 text-gray-600",
  "document.signed": "bg-green-100 text-green-600",
  "document.completed": "bg-green-100 text-green-600",
  "document.voided": "bg-red-100 text-red-600",
  "document.declined": "bg-red-100 text-red-600",
  "recipient.email_sent": "bg-blue-100 text-blue-600",
  "recipient.reminder_sent": "bg-orange-100 text-orange-600",
  "field.updated": "bg-gray-100 text-gray-600",
}

export function AuditTimeline({ events }: AuditTimelineProps) {
  if (events.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No audit events recorded yet</div>
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`p-2 rounded-full ${eventColors[event.event_type] || "bg-gray-100 text-gray-600"}`}>
              {eventIcons[event.event_type] || <FileText className="h-4 w-4" />}
            </div>
            {index < events.length - 1 && <div className="w-px h-full bg-border mt-2" />}
          </div>
          <div className="flex-1 pb-4">
            <p className="font-medium">{formatAuditEvent(event)}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>{format(new Date(event.created_at), "PPp")}</span>
              {event.ip_address && (
                <>
                  <span>•</span>
                  <span>IP: {event.ip_address}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
