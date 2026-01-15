-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Organizations: Allow authenticated users to create orgs, then view/update their own
CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own organization" ON organizations
  FOR UPDATE USING (
    id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Users: Can view/update themselves and org members
CREATE POLICY "Users can view org members" ON users
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    OR id = auth.uid()
  );

CREATE POLICY "Users can update themselves" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert themselves" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- Contacts: Organization-scoped
CREATE POLICY "Users can view org contacts" ON contacts
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage org contacts" ON contacts
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Documents: Organization-scoped
CREATE POLICY "Users can view org documents" ON documents
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage org documents" ON documents
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Document Files: Through document access
CREATE POLICY "Users can view document files" ON document_files
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage document files" ON document_files
  FOR ALL USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Recipients: Through document access
CREATE POLICY "Users can view document recipients" ON recipients
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage document recipients" ON recipients
  FOR ALL USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Signing Sessions: Through document access for internal users
CREATE POLICY "Users can view signing sessions" ON signing_sessions
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage signing sessions" ON signing_sessions
  FOR ALL USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Fields: Through document access
CREATE POLICY "Users can view document fields" ON fields
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage document fields" ON fields
  FOR ALL USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Templates: Organization-scoped
CREATE POLICY "Users can view org templates" ON templates
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage org templates" ON templates
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Template Fields: Through template access
CREATE POLICY "Users can view template fields" ON template_fields
  FOR SELECT USING (
    template_id IN (
      SELECT id FROM templates WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage template fields" ON template_fields
  FOR ALL USING (
    template_id IN (
      SELECT id FROM templates WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Audit Events: Organization-scoped
CREATE POLICY "Users can view org audit events" ON audit_events
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert audit events" ON audit_events
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );
