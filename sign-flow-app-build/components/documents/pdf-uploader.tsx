"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PdfUploaderProps {
  onUpload: (url: string, filename: string, pageCount: number) => void
  currentUrl: string | null
  currentFilename: string | null
}

export function PdfUploader({ onUpload, currentUrl, currentFilename }: PdfUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file")
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB")
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

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const { url, pageCount } = await response.json()
        onUpload(url, file.name, pageCount || 1)
        toast.success("PDF uploaded successfully")
      } catch {
        toast.error("Failed to upload PDF")
      } finally {
        setIsUploading(false)
      }
    },
    [onUpload],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: isUploading,
  })

  const handleRemove = () => {
    onUpload("", "", 0)
  }

  if (currentUrl && currentFilename) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <p className="font-medium">{currentFilename}</p>
            <p className="text-sm text-muted-foreground">PDF uploaded</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
      } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
        </>
      ) : (
        <>
          <Upload className="h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {isDragActive ? "Drop PDF here" : "Drag & drop PDF or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Max 10MB</p>
        </>
      )}
    </div>
  )
}
