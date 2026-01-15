"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eraser, Check } from "lucide-react"

interface SignatureModalProps {
  open: boolean
  onClose: () => void
  onComplete: (signatureData: string) => void
  type: "signature" | "initials"
}

export function SignatureModal({ open, onClose, onComplete, type }: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [typedText, setTypedText] = useState("")
  const [hasDrawn, setHasDrawn] = useState(false)
  const [activeTab, setActiveTab] = useState<"draw" | "type">("draw")

  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = "#000"
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
      }
    }
    setHasDrawn(false)
    setTypedText("")
  }, [open])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(true)
    setHasDrawn(true)
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleComplete = () => {
    if (activeTab === "draw") {
      const canvas = canvasRef.current
      if (!canvas) return
      const dataUrl = canvas.toDataURL("image/png")
      onComplete(dataUrl)
    } else {
      // Create signature from typed text
      const canvas = document.createElement("canvas")
      canvas.width = 400
      canvas.height = 100
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "black"
      ctx.font = type === "initials" ? "bold 48px 'Brush Script MT', cursive" : "48px 'Brush Script MT', cursive"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(typedText, canvas.width / 2, canvas.height / 2)

      const dataUrl = canvas.toDataURL("image/png")
      onComplete(dataUrl)
    }
  }

  const canComplete = activeTab === "draw" ? hasDrawn : typedText.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{type === "initials" ? "Add Your Initials" : "Add Your Signature"}</DialogTitle>
          <DialogDescription>
            {type === "initials" ? "Draw or type your initials" : "Draw or type your signature"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "draw" | "type")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="type">Type</TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-4">
            <div className="border rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <Button variant="outline" size="sm" onClick={clearCanvas}>
              <Eraser className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <Input
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={type === "initials" ? "e.g., JD" : "Type your full name"}
              className="text-center text-2xl font-serif h-16"
              maxLength={type === "initials" ? 5 : 50}
            />
            {typedText && (
              <div className="border rounded-lg p-6 bg-white text-center">
                <span className="text-3xl font-['Brush_Script_MT',cursive] text-black">{typedText}</span>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleComplete} disabled={!canComplete}>
            <Check className="mr-2 h-4 w-4" />
            Adopt {type === "initials" ? "Initials" : "Signature"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
