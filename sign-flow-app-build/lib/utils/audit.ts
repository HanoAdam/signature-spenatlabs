import { createClient } from "@/lib/supabase/server"

export type AuditEventType =
  | "document.created"
  | "document.sent"
  | "document.viewed"
  | "document.signed"
  | "document.completed"
  | "document.voided"
  | "document.declined"
  | "recipient.email_sent"
  | "recipient.reminder_sent"
  | "field.updated"

interface AuditEventData {
  documentId: string
  eventType: AuditEventType
  actorType: "internal_user" | "recipient" | "system"
  actorId?: string
  recipientId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function logAuditEvent(data: AuditEventData) {
  const supabase = await createClient()

  const { error } = await supabase.from("audit_events").insert({
    document_id: data.documentId,
    event_type: data.eventType,
    actor_type: data.actorType,
    actor_id: data.actorId,
    recipient_id: data.recipientId,
    metadata: data.metadata || {},
    ip_address: data.ipAddress,
    user_agent: data.userAgent,
  })

  if (error) {
    console.error("Failed to log audit event:", error)
  }

  return { error }
}

export async function getAuditTrail(documentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("audit_events")
    .select(`
      *,
      recipient:recipients(name, email)
    `)
    .eq("document_id", documentId)
    .order("created_at", { ascending: true })

  return { data, error }
}

export function formatAuditEvent(event: {
  event_type: string
  actor_type: string
  recipient?: { name: string; email: string } | null
  metadata?: Record<string, unknown>
}): string {
  const recipientName = event.recipient?.name || event.recipient?.email || "Unknown"

  const eventDescriptions: Record<string, string> = {
    "document.created": "Document created",
    "document.sent": "Document sent for signature",
    "document.viewed": `Document viewed by ${recipientName}`,
    "document.signed": `Document signed by ${recipientName}`,
    "document.completed": "All signatures collected - document completed",
    "document.voided": "Document voided",
    "document.declined": `Document declined by ${recipientName}`,
    "recipient.email_sent": `Signature request sent to ${recipientName}`,
    "recipient.reminder_sent": `Reminder sent to ${recipientName}`,
    "field.updated": `Field updated by ${recipientName}`,
  }

  return eventDescriptions[event.event_type] || event.event_type
}
