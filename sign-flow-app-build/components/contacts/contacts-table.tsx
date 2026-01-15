"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Users, Loader2 } from "lucide-react"
import type { Contact } from "@/lib/types"

interface ContactsTableProps {
  contacts: Contact[]
  organizationId: string
}

export function ContactsTable({ contacts: initialContacts, organizationId }: ContactsTableProps) {
  const router = useRouter()
  const [contacts, setContacts] = useState(initialContacts)
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    notes: "",
  })

  const filteredContacts = contacts.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase()),
  )

  const resetForm = () => {
    setFormData({ name: "", email: "", company: "", phone: "", notes: "" })
    setEditingContact(null)
  }

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name || "",
      email: contact.email,
      company: contact.company || "",
      phone: contact.phone || "",
      notes: contact.notes || "",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.email.trim()) {
      toast.error("Email is required")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/contacts", {
        method: editingContact ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          id: editingContact?.id,
          organizationId,
        }),
      })

      if (!response.ok) throw new Error("Failed to save")

      const { contact } = await response.json()

      if (editingContact) {
        setContacts(contacts.map((c) => (c.id === contact.id ? contact : c)))
        toast.success("Contact updated")
      } else {
        setContacts([...contacts, contact])
        toast.success("Contact created")
      }

      setIsDialogOpen(false)
      resetForm()
      router.refresh()
    } catch {
      toast.error("Failed to save contact")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/contacts?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete")

      setContacts(contacts.filter((c) => c.id !== id))
      toast.success("Contact deleted")
    } catch {
      toast.error("Failed to delete contact")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
              <DialogDescription>
                {editingContact ? "Update contact information" : "Add a new contact to your organization"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Acme Inc."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 555 123 4567"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingContact ? "Update" : "Add"} Contact
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">No contacts found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name || "-"}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.company || "-"}</TableCell>
                  <TableCell>{contact.phone || "-"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(contact)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(contact.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
