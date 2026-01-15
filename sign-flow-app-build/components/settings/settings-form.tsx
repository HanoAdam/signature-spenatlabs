"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { User, Organization } from "@/lib/types"

interface SettingsFormProps {
  user: User
  organization: Organization
  teamMembers: User[]
}

export function SettingsForm({ user, organization, teamMembers }: SettingsFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const [profileData, setProfileData] = useState({
    fullName: user.full_name || "",
    email: user.email,
  })

  const [orgData, setOrgData] = useState({
    name: organization.name,
    tokenExpiryDays: organization.settings?.token_expiry_days || 7,
  })

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: profileData.fullName }),
      })

      if (!response.ok) throw new Error("Failed to save")
      toast.success("Profile updated")
      router.refresh()
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveOrg = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/settings/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgData.name,
          settings: { token_expiry_days: orgData.tokenExpiryDays },
        }),
      })

      if (!response.ok) throw new Error("Failed to save")
      toast.success("Organization updated")
      router.refresh()
    } catch {
      toast.error("Failed to update organization")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="organization">Organization</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profileData.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="organization" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
            <CardDescription>Manage your organization preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={orgData.name}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tokenExpiry">Signing Token Expiry (days)</Label>
              <Input
                id="tokenExpiry"
                type="number"
                min={1}
                max={30}
                value={orgData.tokenExpiryDays}
                onChange={(e) => setOrgData({ ...orgData, tokenExpiryDays: Number.parseInt(e.target.value) || 7 })}
              />
              <p className="text-xs text-muted-foreground">How long signing links remain valid</p>
            </div>
            <Button onClick={handleSaveOrg} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="team" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>People in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => {
                const initials = member.full_name
                  ? member.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : member.email[0].toUpperCase()

                return (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.full_name || member.email}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {member.role}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
