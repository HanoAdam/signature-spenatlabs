"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { FileSignature } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { signIn } from "./actions"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()

  const urlError = searchParams.get("error")

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await signIn(formData)
      if (result?.error) {
        setError(result.error)
      }
    } catch {
      // Redirect happened - this is expected on success
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <FileSignature className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold">SignFlow</span>
          </div>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Welcome back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" autoComplete="current-password" required />
                  </div>
                  {(error || urlError) && (
                    <p className="text-sm text-destructive">
                      {error ||
                        (urlError === "profile_setup_failed"
                          ? "Failed to set up your profile. Please try again."
                          : urlError)}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  {"Don't have an account? "}
                  <Link href="/auth/sign-up" className="underline underline-offset-4 hover:text-primary">
                    Sign up
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
