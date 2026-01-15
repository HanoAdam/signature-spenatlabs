// PDF utility functions for document handling
// Note: Full PDF manipulation requires pdf-lib on the server

export interface FieldOverlay {
  id: string
  type: "signature" | "initial" | "date" | "text" | "checkbox"
  x: number
  y: number
  width: number
  height: number
  page: number
  value?: string
  signatureDataUrl?: string
}

export function calculateFieldPosition(
  field: FieldOverlay,
  containerWidth: number,
  containerHeight: number,
  pdfWidth: number,
  pdfHeight: number,
) {
  // Convert percentage-based positions to actual pixels
  const scaleX = containerWidth / pdfWidth
  const scaleY = containerHeight / pdfHeight

  return {
    left: field.x * scaleX,
    top: field.y * scaleY,
    width: field.width * scaleX,
    height: field.height * scaleY,
  }
}

export function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function getFieldTypeLabel(type: FieldOverlay["type"]): string {
  const labels: Record<FieldOverlay["type"], string> = {
    signature: "Signature",
    initial: "Initials",
    date: "Date",
    text: "Text",
    checkbox: "Checkbox",
  }
  return labels[type]
}

export function getFieldTypeColor(type: FieldOverlay["type"]): string {
  const colors: Record<FieldOverlay["type"], string> = {
    signature: "bg-blue-100 border-blue-400 text-blue-700",
    initial: "bg-purple-100 border-purple-400 text-purple-700",
    date: "bg-green-100 border-green-400 text-green-700",
    text: "bg-orange-100 border-orange-400 text-orange-700",
    checkbox: "bg-pink-100 border-pink-400 text-pink-700",
  }
  return colors[type]
}
