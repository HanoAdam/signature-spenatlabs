"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, GripVertical } from "lucide-react"
import type { Contact, Recipient, RecipientRole } from "@/lib/types"

interface RecipientManagerProps {
  recipients: Partial<Recipient>[]
  setRecipients: React.Dispatch<React.SetStateAction<Partial<Recipient>[]>>
  contacts: Contact[]
  signingOrder: "sequential" | "parallel"
}

const roleColors: Record<RecipientRole, string> = {
  signer: "bg-blue-500",
  approver: "bg-amber-500",
  cc: "bg-gray-400",
}

export function RecipientManager({ recipients, setRecipients, contacts, signingOrder }: RecipientManagerProps) {
  const addRecipient = () => {
    setRecipients([
      ...recipients,
      {
        name: "",
        email: "",
        role: "signer" as RecipientRole,
        signing_order: recipients.length + 1,
      },
    ])
  }

  const updateRecipient = (index: number, updates: Partial<Recipient>) => {
    const newRecipients = [...recipients]
    newRecipients[index] = { ...newRecipients[index], ...updates }
    setRecipients(newRecipients)
  }

  const removeRecipient = (index: number) => {
    const newRecipients = recipients.filter((_, i) => i !== index)
    // Re-order
    newRecipients.forEach((r, i) => {
      r.signing_order = i + 1
    })
    setRecipients(newRecipients)
  }

  const selectContact = (index: number, contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId)
    if (contact) {
      updateRecipient(index, {
        contact_id: contact.id,
        name: contact.name || "",
        email: contact.email,
      })
    }
  }

  return (
    <div className="space-y-4">
      {recipients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
          <p className="text-sm text-muted-foreground mb-4">No recipients added yet</p>
          <Button onClick={addRecipient}>
            <Plus className="mr-2 h-4 w-4" />
            Add Recipient
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {recipients.map((recipient, index) => (
            <div key={index} className="flex items-start gap-4 rounded-lg border p-4">
              {signingOrder === "sequential" && (
                <div className="flex flex-col items-center gap-1 pt-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {index + 1}
                  </span>
                </div>
              )}

              <div className="flex-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {contacts.length > 0 && (
                  <div className="sm:col-span-2 lg:col-span-4">
                    <Label className="text-xs text-muted-foreground">Quick Select Contact</Label>
                    <Select onValueChange={(v) => selectContact(index, v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select from contacts..." />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name || contact.email} {contact.company ? `(${contact.company})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor={`name-${index}`}>Name</Label>
                  <Input
                    id={`name-${index}`}
                    value={recipient.name || ""}
                    onChange={(e) => updateRecipient(index, { name: e.target.value })}
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`email-${index}`}>Email</Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    value={recipient.email || ""}
                    onChange={(e) => updateRecipient(index, { email: e.target.value })}
                    placeholder="john@example.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`role-${index}`}>Role</Label>
                  <Select
                    value={recipient.role || "signer"}
                    onValueChange={(v) => updateRecipient(index, { role: v as RecipientRole })}
                  >
                    <SelectTrigger id={`role-${index}`} className="mt-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${roleColors[(recipient.role as RecipientRole) || "signer"]}`}
                        />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="signer">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${roleColors.signer}`} />
                          Signer
                        </div>
                      </SelectItem>
                      <SelectItem value="approver">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${roleColors.approver}`} />
                          Approver
                        </div>
                      </SelectItem>
                      <SelectItem value="cc">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${roleColors.cc}`} />
                          CC (Copy)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRecipient(index)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button variant="outline" onClick={addRecipient} className="w-full bg-transparent">
            <Plus className="mr-2 h-4 w-4" />
            Add Another Recipient
          </Button>
        </div>
      )}
    </div>
  )
}
