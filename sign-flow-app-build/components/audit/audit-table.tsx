"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ScrollText } from "lucide-react"
import type { AuditEvent, Document } from "@/lib/types"

interface AuditTableProps {
  events: (AuditEvent & { documents?: Pick<Document, "title"> })[]
}

const eventTypeLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> =
  {
    "document.created": { label: "Created", variant: "secondary" },
    "document.sent": { label: "Sent", variant: "default" },
    "document.viewed": { label: "Viewed", variant: "outline" },
    "document.signed": { label: "Signed", variant: "default" },
    "document.completed": { label: "Completed", variant: "default" },
    "document.voided": { label: "Voided", variant: "destructive" },
    "recipient.viewed": { label: "Recipient Viewed", variant: "outline" },
    "recipient.signed": { label: "Recipient Signed", variant: "default" },
  }

export function AuditTable({ events }: AuditTableProps) {
  const [search, setSearch] = useState("")
  const [eventFilter, setEventFilter] = useState<string>("all")

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.actor_email?.toLowerCase().includes(search.toLowerCase()) ||
      e.documents?.title?.toLowerCase().includes(search.toLowerCase())
    const matchesEvent = eventFilter === "all" || e.event_type === eventFilter
    return matchesSearch && matchesEvent
  })

  const uniqueEventTypes = [...new Set(events.map((e) => e.event_type))]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email or document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {uniqueEventTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {eventTypeLabels[type]?.label || type.replace(".", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <ScrollText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">No audit events found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => {
                const eventConfig = eventTypeLabels[event.event_type] || { label: event.event_type, variant: "outline" }
                return (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge variant={eventConfig.variant as "default" | "secondary" | "destructive" | "outline"}>
                        {eventConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{event.documents?.title || "-"}</TableCell>
                    <TableCell>{event.actor_email || "System"}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{event.ip_address || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
