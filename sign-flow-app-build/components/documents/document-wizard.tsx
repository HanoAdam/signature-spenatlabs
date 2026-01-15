"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Upload, FileText, Users, Settings2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { PdfUploader } from "@/components/documents/pdf-uploader"
import { RecipientManager } from "@/components/documents/recipient-manager"
import { FieldPlacementEditor } from "@/components/documents/field-placement-editor"
import type { Template, Contact, Recipient, Field } from "@/lib/types"

interface DocumentWizardProps {
  templates: Template[]
  contacts: Contact[]
  organizationId: string
  userId: string
}

type WizardStep = "upload" | "recipients" | "fields" | "review"

export function DocumentWizard({ templates, contacts, organizationId, userId }: DocumentWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>("upload")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Document state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfFilename, setPdfFilename] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [signingOrder, setSigningOrder] = useState<"sequential" | "parallel">("parallel")
  const [recipients, setRecipients] = useState<Partial<Recipient>[]>([])
  const [fields, setFields] = useState<Partial<Field>[]>([])

  const steps: { id: WizardStep; title: string; icon: React.ElementType }[] = [
    { id: "upload", title: "Upload PDF", icon: Upload },
    { id: "recipients", title: "Add Recipients", icon: Users },
    { id: "fields", title: "Place Fields", icon: Settings2 },
    { id: "review", title: "Review & Send", icon: FileText },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === step)

  const canProceed = () => {
    switch (step) {
      case "upload":
        return pdfUrl && title.trim()
      case "recipients":
        return recipients.length > 0 && recipients.every((r) => r.email && r.name)
      case "fields":
        return true // Fields are optional but recommended
      case "review":
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex].id)
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setStep(steps[prevIndex].id)
    }
  }

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template.id)
    setPdfUrl(template.file_url)
    setPdfFilename(template.filename)
    setTitle(template.name)
    setDescription(template.description || "")
  }

  const handleSubmit = async (sendNow: boolean) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          pdfUrl,
          pdfFilename,
          pageCount,
          signingOrder,
          recipients,
          fields,
          organizationId,
          userId,
          templateId: selectedTemplate,
          sendNow,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create document")
      }

      const { documentId } = await response.json()
      toast.success(sendNow ? "Document sent for signing" : "Document saved as draft")
      router.push(`/documents/${documentId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create document")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => i < currentStepIndex && setStep(s.id)}
                disabled={i > currentStepIndex}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  s.id === step
                    ? "bg-primary text-primary-foreground"
                    : i < currentStepIndex
                      ? "bg-muted text-foreground hover:bg-muted/80"
                      : "text-muted-foreground"
                }`}
              >
                <s.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{s.title}</span>
              </button>
              {i < steps.length - 1 && <div className="mx-2 h-px w-8 bg-border" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStepIndex].title}</CardTitle>
          <CardDescription>
            {step === "upload" && "Upload a PDF or select from your templates"}
            {step === "recipients" && "Add the people who need to sign this document"}
            {step === "fields" && "Place signature fields and other inputs on the document"}
            {step === "review" && "Review your document and send for signing"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "upload" && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Document Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Service Agreement - Acme Corp"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of this document..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-sm font-medium">Upload New PDF</h3>
                  <PdfUploader
                    onUpload={(url, filename, pages) => {
                      setPdfUrl(url)
                      setPdfFilename(filename)
                      setPageCount(pages)
                      setSelectedTemplate(null)
                    }}
                    currentUrl={!selectedTemplate ? pdfUrl : null}
                    currentFilename={!selectedTemplate ? pdfFilename : null}
                  />
                </div>

                {templates.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-medium">Or Select Template</h3>
                    <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
                            selectedTemplate === template.id ? "border-primary bg-primary/5" : ""
                          }`}
                        >
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{template.name}</p>
                            {template.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">{template.description}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "recipients" && (
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Signing Order</Label>
                <RadioGroup
                  value={signingOrder}
                  onValueChange={(v) => setSigningOrder(v as "sequential" | "parallel")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="parallel" id="parallel" />
                    <Label htmlFor="parallel" className="font-normal">
                      Everyone signs at the same time
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sequential" id="sequential" />
                    <Label htmlFor="sequential" className="font-normal">
                      Sign in order (1, 2, 3...)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <RecipientManager
                recipients={recipients}
                setRecipients={setRecipients}
                contacts={contacts}
                signingOrder={signingOrder}
              />
            </div>
          )}

          {step === "fields" && pdfUrl && (
            <FieldPlacementEditor
              pdfUrl={pdfUrl}
              pageCount={pageCount}
              recipients={recipients}
              fields={fields}
              setFields={setFields}
            />
          )}

          {step === "review" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-medium">Document Details</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Title:</dt>
                      <dd>{title}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">File:</dt>
                      <dd>{pdfFilename}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Pages:</dt>
                      <dd>{pageCount}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Signing Order:</dt>
                      <dd className="capitalize">{signingOrder}</dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Recipients ({recipients.length})</h3>
                  <ul className="space-y-2 text-sm">
                    {recipients.map((r, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span>
                          {r.name} ({r.email})
                        </span>
                        <span className="text-muted-foreground capitalize">{r.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Fields ({fields.length})</h3>
                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No fields placed. Recipients can still view and acknowledge the document.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {fields.filter((f) => f.type === "signature").length} signature fields,{" "}
                    {fields.filter((f) => f.type !== "signature").length} other fields
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStepIndex === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex gap-2">
          {step === "review" ? (
            <>
              <Button variant="outline" onClick={() => handleSubmit(false)} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save as Draft
              </Button>
              <Button onClick={() => handleSubmit(true)} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send for Signing
              </Button>
            </>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
