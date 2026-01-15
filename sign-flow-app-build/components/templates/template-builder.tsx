"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Document, Page, pdfjs } from "react-pdf"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Upload,
  FileText,
  X,
  Loader2,
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
  Save,
} from "lucide-react"
import type { FieldType, RecipientRole, TemplateField } from "@/lib/types"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface TemplateBuilderProps {
  organizationId: string
  userId: string
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

const recipientRoles: { role: RecipientRole; label: string; color: string }[] = [
  { role: "signer", label: "Signer", color: "bg-blue-500" },
  { role: "approver", label: "Approver", color: "bg-amber-500" },
]

export function TemplateBuilder({ organizationId, userId }: TemplateBuilderProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfFilename, setPdfFilename] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>("signature")
  const [selectedRole, setSelectedRole] = useState<RecipientRole>("signer")
  const [selectedOrder, setSelectedOrder] = useState(1)
  const [isRequired, setIsRequired] = useState(true)

  const [fields, setFields] = useState<Partial<TemplateField>[]>([])
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { url, pageCount: pages } = await response.json()
      setPdfUrl(url)
      setPdfFilename(file.name)
      setPageCount(pages || 1)
      toast.success("PDF uploaded")
    } catch {
      toast.error("Failed to upload PDF")
    } finally {
      setIsUploading(false)
    }
  }

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return

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

    const newField: Partial<TemplateField> = {
      type: selectedFieldType,
      page: currentPage,
      x: Math.max(0, Math.min(100 - size.width, x - size.width / 2)),
      y: Math.max(0, Math.min(100 - size.height, y - size.height / 2)),
      width: size.width,
      height: size.height,
      required: isRequired,
      recipient_role: selectedRole,
      recipient_order: selectedOrder,
    }

    setFields([...fields, newField])
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a template name")
      return
    }
    if (!pdfUrl) {
      toast.error("Please upload a PDF")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          fileUrl: pdfUrl,
          filename: pdfFilename,
          pageCount,
          fields,
          organizationId,
          userId,
        }),
      })

      if (!response.ok) throw new Error("Failed to save")

      toast.success("Template saved")
      router.push("/templates")
    } catch {
      toast.error("Failed to save template")
    } finally {
      setIsSaving(false)
    }
  }

  const pageFields = fields.filter((f) => f.page === currentPage)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Template Name</Label>
            <Input id="name" placeholder="e.g., Standard NDA" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={1}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 min-h-[600px]">
        {/* Upload and Toolbar */}
        <div className="w-64 shrink-0 space-y-4">
          {!pdfUrl ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload PDF</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Click to upload PDF</p>
                    </>
                  )}
                </label>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium truncate max-w-[150px]">{pdfFilename}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setPdfUrl(null)
                        setPdfFilename(null)
                        setFields([])
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Field Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  <div>
                    <Label className="text-xs text-muted-foreground">Assign to Role</Label>
                    <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as RecipientRole)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {recipientRoles.map(({ role, label, color }) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${color}`} />
                              {label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Recipient Order</Label>
                    <Select value={String(selectedOrder)} onValueChange={(v) => setSelectedOrder(Number(v))}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            Recipient #{n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="required" checked={isRequired} onCheckedChange={(c) => setIsRequired(c === true)} />
                    <Label htmlFor="required" className="text-sm">
                      Required field
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Fields ({pageFields.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-32">
                    {pageFields.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Click on PDF to place fields</p>
                    ) : (
                      <div className="space-y-2">
                        {pageFields.map((field, i) => {
                          const fieldIndex = fields.findIndex((f) => f === field)
                          const roleColor =
                            recipientRoles.find((r) => r.role === field.recipient_role)?.color || "bg-gray-400"
                          return (
                            <div key={i} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${roleColor}`} />
                                <span className="capitalize">{field.type}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeField(fieldIndex)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 flex flex-col">
          {pdfUrl ? (
            <>
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
              </div>

              <ScrollArea className="flex-1 border rounded-lg bg-muted/30">
                <div className="p-4 flex justify-center">
                  <div
                    ref={containerRef}
                    className="relative cursor-crosshair shadow-lg"
                    onClick={handlePageClick}
                    style={{ width: pdfDimensions.width, height: pdfDimensions.height }}
                  >
                    <Document file={pdfUrl} loading={<div className="p-8 text-center">Loading PDF...</div>}>
                      <Page
                        pageNumber={currentPage}
                        onLoadSuccess={(page) => {
                          setPdfDimensions({ width: page.width, height: page.height })
                        }}
                      />
                    </Document>

                    {pageFields.map((field, i) => {
                      const roleColor =
                        recipientRoles.find((r) => r.role === field.recipient_role)?.color || "bg-gray-400"
                      const FieldIcon = fieldTypes.find((f) => f.type === field.type)?.icon || PenLine
                      return (
                        <div
                          key={i}
                          className={`absolute border-2 rounded flex items-center justify-center ${roleColor} bg-opacity-20`}
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
            </>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <CardDescription>Upload a PDF to start building your template</CardDescription>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !pdfUrl || !name.trim()}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Template
        </Button>
      </div>
    </div>
  )
}
