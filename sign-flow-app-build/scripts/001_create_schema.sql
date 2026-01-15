-- SignFlow Database Schema
-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (internal team members)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts (external recipients)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'completed', 'voided', 'expired')),
  signing_order TEXT NOT NULL DEFAULT 'parallel' CHECK (signing_order IN ('sequential', 'parallel')),
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  voided_reason TEXT,
  template_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Files (original + signed PDFs)
CREATE TABLE IF NOT EXISTS document_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('original', 'signed')),
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  size_bytes INTEGER,
  checksum TEXT,
  page_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipients
CREATE TABLE IF NOT EXISTS recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'signer' CHECK (role IN ('signer', 'approver', 'cc')),
  signing_order INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'viewed', 'signed', 'declined')),
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signing Sessions (token-based access for external recipients)
CREATE TABLE IF NOT EXISTS signing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fields (signature, initials, text, etc.)
CREATE TABLE IF NOT EXISTS fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('signature', 'initials', 'date', 'name', 'email', 'text', 'checkbox')),
  page INTEGER NOT NULL,
  x DECIMAL NOT NULL,
  y DECIMAL NOT NULL,
  width DECIMAL NOT NULL,
  height DECIMAL NOT NULL,
  required BOOLEAN DEFAULT TRUE,
  placeholder TEXT,
  value JSONB,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  page_count INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template Fields
CREATE TABLE IF NOT EXISTS template_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('signature', 'initials', 'date', 'name', 'email', 'text', 'checkbox')),
  page INTEGER NOT NULL,
  x DECIMAL NOT NULL,
  y DECIMAL NOT NULL,
  width DECIMAL NOT NULL,
  height DECIMAL NOT NULL,
  required BOOLEAN DEFAULT TRUE,
  placeholder TEXT,
  recipient_role TEXT DEFAULT 'signer',
  recipient_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Events
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_recipients_document ON recipients(document_id);
CREATE INDEX IF NOT EXISTS idx_recipients_email ON recipients(email);
CREATE INDEX IF NOT EXISTS idx_signing_sessions_token ON signing_sessions(token);
CREATE INDEX IF NOT EXISTS idx_fields_document ON fields(document_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_document ON audit_events(document_id);
CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_templates_org ON templates(organization_id);
