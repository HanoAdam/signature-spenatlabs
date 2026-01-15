export type DocumentStatus = "draft" | "pending" | "completed" | "voided" | "expired"
export type RecipientRole = "signer" | "approver" | "cc"
export type RecipientStatus = "pending" | "sent" | "viewed" | "signed" | "declined"
export type FieldType = "signature" | "initials" | "date" | "name" | "email" | "text" | "checkbox"
export type SigningOrder = "sequential" | "parallel"
export type UserRole = "owner" | "admin" | "member"

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  settings: {
    token_expiry_days?: number
    reminder_days?: number[]
  }
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  organization_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  organization_id: string
  email: string
  name: string | null
  company: string | null
  phone: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  organization_id: string
  created_by: string
  title: string
  description: string | null
  status: DocumentStatus
  signing_order: SigningOrder
  expires_at: string | null
  completed_at: string | null
  voided_at: string | null
  voided_reason: string | null
  template_id: string | null
  created_at: string
  updated_at: string
}

export interface DocumentFile {
  id: string
  document_id: string
  file_type: "original" | "signed"
  url: string
  filename: string
  size_bytes: number | null
  checksum: string | null
  page_count: number | null
  created_at: string
}

export interface Recipient {
  id: string
  document_id: string
  contact_id: string | null
  name: string
  email: string
  role: RecipientRole
  signing_order: number
  status: RecipientStatus
  viewed_at: string | null
  signed_at: string | null
  declined_at: string | null
  decline_reason: string | null
  created_at: string
  updated_at: string
}

export interface SigningSession {
  id: string
  recipient_id: string
  document_id: string
  token: string
  expires_at: string
  used_at: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface Field {
  id: string
  document_id: string
  recipient_id: string
  type: FieldType
  page: number
  x: number
  y: number
  width: number
  height: number
  required: boolean
  placeholder: string | null
  value: unknown
  signed_at: string | null
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  organization_id: string
  created_by: string
  name: string
  description: string | null
  file_url: string
  filename: string
  page_count: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TemplateField {
  id: string
  template_id: string
  type: FieldType
  page: number
  x: number
  y: number
  width: number
  height: number
  required: boolean
  placeholder: string | null
  recipient_role: RecipientRole
  recipient_order: number
  created_at: string
}

export interface AuditEvent {
  id: string
  organization_id: string | null
  document_id: string | null
  event_type: string
  actor_user_id: string | null
  actor_email: string | null
  actor_name: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// Extended types with relations
export interface DocumentWithRelations extends Document {
  files?: DocumentFile[]
  recipients?: Recipient[]
  fields?: Field[]
  created_by_user?: User
}

export interface RecipientWithFields extends Recipient {
  fields?: Field[]
}
