"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Document, Page, pdfjs } from "react-pdf"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { FileSignature, ChevronLeft, ChevronRight, ArrowRight, Check, PenLine, Loader2, Download } from "lucide-react"
import { SignatureModal } from "@/components/signing/signature-modal"
import type { SigningSession, Document as DocType, Recipient, Field } from "@/lib/types"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface SigningRoomProps {
  session: SigningSession
  document: DocType
  recipient: Recipient
  pdfUrl: string
  fields: Field[]
  allRecipients: Recipient[]
}

export function SigningRoom({ session, document, recipient, pdfUrl, fields, allRecipients }: SigningRoomProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(1)
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)

  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({})
  const [signatureModalOpen, setSignatureModalOpen] = useState(false)
  const [currentSignatureField, setCurrentSignatureField] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Initialize field values
  useEffect(() => {
    const initial: Record<string, unknown> = {}
    fields.forEach((f) => {
      if (f.type === "name") initial[f.id] = recipient.name
      if (f.type === "email") initial[f.id] = recipient.email
      if (f.type === "date") initial[f.id] = new Date().toLocaleDateString()
      if (f.value) initial[f.id] = f.value
    })
    setFieldValues(initial)
  }, [fields, recipient])

  const requiredFields = fields.filter((f) => f.required)
  const completedFields = requiredFields.filter((f) => {
    const value = fieldValues[f.id]
    if (f.type === "checkbox") return value === true
    return value && String(value).trim() !== ""
  })
  const progress = requiredFields.length > 0 ? (completedFields.length / requiredFields.length) * 100 : 100

  const currentPageFields = fields.filter((f) => f.page === currentPage)

  const findNextIncompleteField = () => {
    for (let page = 1; page <= numPages; page++) {
      const pageFields = fields.filter((f) => f.page === page && f.required)
      for (const field of pageFields) {
        const value = fieldValues[field.id]
        const isComplete = field.type === "checkbox" ? value === true : value && String(value).trim() !== ""
        if (!isComplete) {
          setCurrentPage(page)
          return field
        }
      }
    }
    return null
  }

  const handleNextField = () => {
    const nextField = findNextIncompleteField()
    if (!nextField) {
      toast.success("All required fields completed!")
    }
  }

  const handleFieldClick = (field: Field) => {
    if (field.type === "signature" || field.type === "initials") {
      setCurrentSignatureField(field.id)
      setSignatureModalOpen(true)
    }
  }

  const handleSignatureComplete = (signatureData: string) => {
    if (currentSignatureField) {
      setFieldValues({ ...fieldValues, [currentSignatureField]: signatureData })
    }
    setSignatureModalOpen(false)
    setCurrentSignatureField(null)
  }

  const handleSubmit = async () => {
    // Validate all required fields
    const incompleteRequired = requiredFields.filter((f) => {
      const value = fieldValues[f.id]
      if (f.type === "checkbox") return value !== true
      return !value || String(value).trim() === ""
    })

    if (incompleteRequired.length > 0) {
      toast.error(`Please complete all required fields (${incompleteRequired.length} remaining)`)
      findNextIncompleteField()
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/public/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: session.token,
          fieldValues,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to submit signature")
      }

      setIsComplete(true)
      toast.success("Document signed successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit signature")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <Check className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-2xl">Signed Successfully!</CardTitle>
            <CardDescription>Thank you for signing &quot;{document.title}&quot;</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Your signature has been recorded. You will receive a copy of the signed document via email once all
              parties have signed.
            </p>
            <Button variant="outline" className="w-full bg-transparent" disabled>
              <Download className="mr-2 h-4 w-4" />
              Download will be available after all parties sign
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <FileSignature className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-semibold line-clamp-1">{document.title}</h1>
                <p className="text-xs text-muted-foreground">Signing as {recipient.name || recipient.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {completedFields.length}/{requiredFields.length} fields
                  </span>
                  <Progress value={progress} className="w-24 h-2" />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={isSubmitting || progress < 100}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PenLine className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Signing..." : "Finish & Sign"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main PDF Viewer */}
          <div className="flex-1">
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
              {requiredFields.length > 0 && progress < 100 && (
                <Button variant="outline" onClick={handleNextField}>
                  Next Field
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>

            <ScrollArea className="border rounded-lg bg-background shadow-sm">
              <div className="p-4 flex justify-center">
                <div
                  ref={containerRef}
                  className="relative"
                  style={{ width: pdfDimensions.width * scale, height: pdfDimensions.height * scale }}
                >
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    loading={<div className="p-8 text-center">Loading document...</div>}
                  >
                    <Page
                      pageNumber={currentPage}
                      scale={scale}
                      onLoadSuccess={(page) => {
                        setPdfDimensions({ width: page.width, height: page.height })
                      }}
                    />
                  </Document>

                  {/* Field overlays */}
                  {currentPageFields.map((field) => (
                    <FieldOverlay
                      key={field.id}
                      field={field}
                      value={fieldValues[field.id]}
                      onChange={(value) => setFieldValues({ ...fieldValues, [field.id]: value })}
                      onClick={() => handleFieldClick(field)}
                    />
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Side Panel */}
          <div className="hidden lg:block w-72 shrink-0 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Document Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {allRecipients.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span className={r.id === recipient.id ? "font-medium" : "text-muted-foreground"}>
                      {r.name || r.email}
                    </span>
                    {r.status === "signed" ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : r.id === recipient.id ? (
                      <span className="text-xs text-primary">Your turn</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Required Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {requiredFields.map((field) => {
                    const value = fieldValues[field.id]
                    const isComplete = field.type === "checkbox" ? value === true : value && String(value).trim() !== ""
                    return (
                      <button
                        key={field.id}
                        onClick={() => {
                          setCurrentPage(field.page)
                          if (field.type === "signature" || field.type === "initials") {
                            handleFieldClick(field)
                          }
                        }}
                        className={`w-full flex items-center justify-between text-sm rounded p-2 transition-colors ${
                          isComplete ? "bg-success/10 text-success" : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        <span className="capitalize">{field.type}</span>
                        {isComplete ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <span className="text-xs">Page {field.page}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SignatureModal
        open={signatureModalOpen}
        onClose={() => {
          setSignatureModalOpen(false)
          setCurrentSignatureField(null)
        }}
        onComplete={handleSignatureComplete}
        type={fields.find((f) => f.id === currentSignatureField)?.type === "initials" ? "initials" : "signature"}
      />
    </div>
  )
}

interface FieldOverlayProps {
  field: Field
  value: unknown
  onChange: (value: unknown) => void
  onClick: () => void
}

function FieldOverlay({ field, value, onChange, onClick }: FieldOverlayProps) {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: `${field.x}%`,
    top: `${field.y}%`,
    width: `${field.width}%`,
    height: `${field.height}%`,
  }

  const hasValue = field.type === "checkbox" ? value === true : value && String(value).trim() !== ""

  if (field.type === "signature" || field.type === "initials") {
    return (
      <button
        onClick={onClick}
        style={baseStyle}
        className={`border-2 border-dashed rounded flex items-center justify-center transition-colors ${
          hasValue ? "border-success bg-success/10" : "border-primary bg-primary/5 hover:bg-primary/10"
        }`}
      >
        {value ? (
          <img
            src={(value as string) || "/placeholder.svg"}
            alt={field.type}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <span className="text-xs text-primary font-medium capitalize">Click to {field.type}</span>
        )}
      </button>
    )
  }

  if (field.type === "checkbox") {
    return (
      <div style={baseStyle} className="flex items-center justify-center">
        <Checkbox checked={value === true} onCheckedChange={(checked) => onChange(checked === true)} />
      </div>
    )
  }

  if (field.type === "text") {
    return (
      <Input
        style={baseStyle}
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || "Enter text"}
        className="h-full text-xs bg-background/80"
      />
    )
  }

  // For date, name, email - show as readonly filled fields
  return (
    <div
      style={baseStyle}
      className={`border rounded px-2 flex items-center text-xs ${
        hasValue ? "border-success bg-success/5" : "border-muted bg-muted/50"
      }`}
    >
      {(value as string) || field.placeholder || field.type}
    </div>
  )
}
