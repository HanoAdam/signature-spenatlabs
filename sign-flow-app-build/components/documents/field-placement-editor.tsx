"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  PenLine,
  Type,
  Calendar,
  User,
  Mail,
  MessageSquare,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react"
import type { Recipient, Field, FieldType } from "@/lib/types"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface FieldPlacementEditorProps {
  pdfUrl: string
  pageCount: number
  recipients: Partial<Recipient>[]
  fields: Partial<Field>[]
  setFields: React.Dispatch<React.SetStateAction<Partial<Field>[]>>
}

const fieldTypes: { type: FieldType; label: string; icon: React.ElementType }[] = [
  { type: "signature", label: "Signature", icon: PenLine },
  { type: "initials", label: "Initials", icon: Type },
  { type: "date", label: "Date", icon: Calendar },
  { type: "name", label: "Name", icon: User },
  { type: "email", label: "Email", icon: Mail },
  { type: "text", label: "Text", icon: MessageSquare },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
]

const recipientColors = ["bg-blue-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500", "bg-purple-500", "bg-cyan-500"]

export function FieldPlacementEditor({ pdfUrl, pageCount, recipients, fields, setFields }: FieldPlacementEditorProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRecipient, setSelectedRecipient] = useState<number>(0)
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>("signature")
  const [isRequired, setIsRequired] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 })

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || recipients.length === 0) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const fieldSizes: Record<FieldType, { width: number; height: number }> = {
      signature: { width: 20, height: 6 },
      initials: { width: 8, height: 6 },
      date: { width: 15, height: 4 },
      name: { width: 20, height: 4 },
      email: { width: 25, height: 4 },
      text: { width: 20, height: 4 },
      checkbox: { width: 3, height: 3 },
    }

    const size = fieldSizes[selectedFieldType]

    const newField: Partial<Field> = {
      type: selectedFieldType,
      page: currentPage,
      x: Math.max(0, Math.min(100 - size.width, x - size.width / 2)),
      y: Math.max(0, Math.min(100 - size.height, y - size.height / 2)),
      width: size.width,
      height: size.height,
      required: isRequired,
      recipient_id: recipients[selectedRecipient]?.id || `temp-${selectedRecipient}`,
    }

    setFields([...fields, newField])
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const pageFields = fields.filter((f) => f.page === currentPage)

  return (
    <div className="flex gap-4 min-h-[600px]">
      {/* Toolbar */}
      <div className="w-64 shrink-0 space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">Assign to Recipient</Label>
          <div className="mt-2 space-y-2">
            {recipients.map((r, i) => (
              <button
                key={i}
                onClick={() => setSelectedRecipient(i)}
                className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left text-sm transition-colors ${
                  selectedRecipient === i ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <div className={`h-3 w-3 rounded-full ${recipientColors[i % recipientColors.length]}`} />
                <span className="truncate">{r.name || r.email}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Field Type</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {fieldTypes.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setSelectedFieldType(type)}
                className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${
                  selectedFieldType === type ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="required" checked={isRequired} onCheckedChange={(c) => setIsRequired(c === true)} />
          <Label htmlFor="required" className="text-sm">
            Required field
          </Label>
        </div>

        <div className="pt-4 border-t">
          <Label className="text-xs text-muted-foreground">Fields on this page ({pageFields.length})</Label>
          <ScrollArea className="mt-2 h-40">
            <div className="space-y-2">
              {pageFields.map((field, i) => {
                const fieldIndex = fields.findIndex((f) => f === field)
                const recipientIndex = recipients.findIndex(
                  (r) => r.id === field.recipient_id || `temp-${recipients.indexOf(r)}` === field.recipient_id,
                )
                return (
                  <div key={i} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${recipientColors[recipientIndex >= 0 ? recipientIndex % recipientColors.length : 0]}`}
                      />
                      <span className="capitalize">{field.type}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeField(fieldIndex)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
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
              Page {currentPage} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= pageCount}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Tabs value={String(scale)} onValueChange={(v) => setScale(Number(v))}>
            <TabsList>
              <TabsTrigger value="0.75">75%</TabsTrigger>
              <TabsTrigger value="1">100%</TabsTrigger>
              <TabsTrigger value="1.25">125%</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1 border rounded-lg bg-muted/30">
          <div className="p-4 flex justify-center">
            <div
              ref={containerRef}
              className="relative cursor-crosshair shadow-lg"
              onClick={handlePageClick}
              style={{ width: pdfDimensions.width * scale, height: pdfDimensions.height * scale }}
            >
              <Document file={pdfUrl} loading={<div className="p-8 text-center">Loading PDF...</div>}>
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  onLoadSuccess={(page) => {
                    setPdfDimensions({ width: page.width, height: page.height })
                  }}
                />
              </Document>

              {/* Field overlays */}
              {pageFields.map((field, i) => {
                const recipientIndex = recipients.findIndex(
                  (r) => r.id === field.recipient_id || `temp-${recipients.indexOf(r)}` === field.recipient_id,
                )
                const FieldIcon = fieldTypes.find((f) => f.type === field.type)?.icon || PenLine
                return (
                  <div
                    key={i}
                    className={`absolute border-2 rounded flex items-center justify-center cursor-move ${
                      recipientColors[recipientIndex >= 0 ? recipientIndex % recipientColors.length : 0]
                    } bg-opacity-20`}
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      width: `${field.width}%`,
                      height: `${field.height}%`,
                      borderColor: "currentColor",
                      backgroundColor: "currentColor",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FieldIcon className="h-4 w-4 text-white" />
                  </div>
                )
              })}
            </div>
          </div>
        </ScrollArea>
        <p className="mt-2 text-xs text-muted-foreground text-center">Click on the document to place fields</p>
      </div>
    </div>
  )
}
