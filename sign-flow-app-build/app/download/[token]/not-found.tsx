export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-2">Download Link Not Found</h1>
        <p className="text-muted-foreground">
          This download link is invalid or has expired. Please contact the sender for a new link.
        </p>
      </div>
    </div>
  )
}
