"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, Search, Eye, Copy, Send, Download, XCircle, FileText } from "lucide-react"
import type { Document, Recipient, DocumentFile } from "@/lib/types"

interface DocumentWithRelations extends Document {
  recipients: Recipient[]
  document_files: DocumentFile[]
}

interface DocumentsTableProps {
  documents: DocumentWithRelations[]
}

export function DocumentsTable({ documents }: DocumentsTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.recipients?.some((r) => r.email.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "pending":
        return <Badge className="bg-warning text-warning-foreground hover:bg-warning/80">Pending</Badge>
      case "completed":
        return <Badge className="bg-success text-success-foreground hover:bg-success/80">Completed</Badge>
      case "voided":
        return <Badge variant="destructive">Voided</Badge>
      case "expired":
        return <Badge variant="outline">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or recipient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="voided">Voided</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">No documents found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <Link href={`/documents/${doc.id}`} className="font-medium hover:underline">
                      {doc.title}
                    </Link>
                    {doc.description && <p className="text-sm text-muted-foreground line-clamp-1">{doc.description}</p>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {doc.recipients?.slice(0, 2).map((r) => (
                        <span key={r.id} className="text-sm">
                          {r.name || r.email}
                        </span>
                      ))}
                      {doc.recipients?.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{doc.recipients.length - 2} more</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/documents/${doc.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        {doc.status === "draft" && (
                          <DropdownMenuItem>
                            <Send className="mr-2 h-4 w-4" />
                            Send for Signing
                          </DropdownMenuItem>
                        )}
                        {doc.status === "pending" && (
                          <DropdownMenuItem>
                            <Send className="mr-2 h-4 w-4" />
                            Send Reminder
                          </DropdownMenuItem>
                        )}
                        {doc.status === "completed" && (
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {doc.status !== "voided" && doc.status !== "completed" && (
                          <DropdownMenuItem className="text-destructive">
                            <XCircle className="mr-2 h-4 w-4" />
                            Void
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
