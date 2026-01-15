import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileSignature, AlertCircle } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
          <FileSignature className="h-6 w-6 text-primary-foreground" />
        </div>
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Signing Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              This signing link is invalid or has already been used. Please contact the sender for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
