-- Fix RLS infinite recursion issue
-- This script fixes the infinite recursion error in RLS policies
-- by using a SECURITY DEFINER helper function

-- Create a helper function to get user's organization_id without triggering RLS recursion
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1;
$$;

-- Drop and recreate users policies to avoid recursion
DROP POLICY IF EXISTS "Users can view org members" ON users;
DROP POLICY IF EXISTS "Users can view themselves" ON users;

-- Policy 1: Users can always view themselves (no recursion)
CREATE POLICY "Users can view themselves" ON users
  FOR SELECT USING (id = auth.uid());

-- Policy 2: Users can view org members (uses helper function to avoid recursion)
CREATE POLICY "Users can view org members" ON users
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

-- Update organizations policies
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT USING (
    id = get_user_organization_id()
  );

DROP POLICY IF EXISTS "Users can update own organization" ON organizations;
CREATE POLICY "Users can update own organization" ON organizations
  FOR UPDATE USING (
    id = get_user_organization_id()
  );

-- Update contacts policies
DROP POLICY IF EXISTS "Users can view org contacts" ON contacts;
CREATE POLICY "Users can view org contacts" ON contacts
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

DROP POLICY IF EXISTS "Users can manage org contacts" ON contacts;
CREATE POLICY "Users can manage org contacts" ON contacts
  FOR ALL USING (
    organization_id = get_user_organization_id()
  );

-- Update documents policies
DROP POLICY IF EXISTS "Users can view org documents" ON documents;
CREATE POLICY "Users can view org documents" ON documents
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

DROP POLICY IF EXISTS "Users can manage org documents" ON documents;
CREATE POLICY "Users can manage org documents" ON documents
  FOR ALL USING (
    organization_id = get_user_organization_id()
  );

-- Update document_files policies
DROP POLICY IF EXISTS "Users can view document files" ON document_files;
CREATE POLICY "Users can view document files" ON document_files
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

DROP POLICY IF EXISTS "Users can manage document files" ON document_files;
CREATE POLICY "Users can manage document files" ON document_files
  FOR ALL USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

-- Update recipients policies
DROP POLICY IF EXISTS "Users can view document recipients" ON recipients;
CREATE POLICY "Users can view document recipients" ON recipients
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

DROP POLICY IF EXISTS "Users can manage document recipients" ON recipients;
CREATE POLICY "Users can manage document recipients" ON recipients
  FOR ALL USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

-- Update signing_sessions policies
DROP POLICY IF EXISTS "Users can view signing sessions" ON signing_sessions;
CREATE POLICY "Users can view signing sessions" ON signing_sessions
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

DROP POLICY IF EXISTS "Users can manage signing sessions" ON signing_sessions;
CREATE POLICY "Users can manage signing sessions" ON signing_sessions
  FOR ALL USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

-- Update fields policies
DROP POLICY IF EXISTS "Users can view document fields" ON fields;
CREATE POLICY "Users can view document fields" ON fields
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

DROP POLICY IF EXISTS "Users can manage document fields" ON fields;
CREATE POLICY "Users can manage document fields" ON fields
  FOR ALL USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

-- Update templates policies
DROP POLICY IF EXISTS "Users can view org templates" ON templates;
CREATE POLICY "Users can view org templates" ON templates
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

DROP POLICY IF EXISTS "Users can manage org templates" ON templates;
CREATE POLICY "Users can manage org templates" ON templates
  FOR ALL USING (
    organization_id = get_user_organization_id()
  );

-- Update template_fields policies
DROP POLICY IF EXISTS "Users can view template fields" ON template_fields;
CREATE POLICY "Users can view template fields" ON template_fields
  FOR SELECT USING (
    template_id IN (
      SELECT id FROM templates WHERE organization_id = get_user_organization_id()
    )
  );

DROP POLICY IF EXISTS "Users can manage template fields" ON template_fields;
CREATE POLICY "Users can manage template fields" ON template_fields
  FOR ALL USING (
    template_id IN (
      SELECT id FROM templates WHERE organization_id = get_user_organization_id()
    )
  );

-- Update audit_events policies
DROP POLICY IF EXISTS "Users can view org audit events" ON audit_events;
CREATE POLICY "Users can view org audit events" ON audit_events
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

DROP POLICY IF EXISTS "Users can insert audit events" ON audit_events;
CREATE POLICY "Users can insert audit events" ON audit_events
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );
