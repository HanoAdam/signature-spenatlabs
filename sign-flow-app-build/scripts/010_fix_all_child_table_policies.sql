-- Fix RLS policies for all child tables (document_files, recipients, fields, signing_sessions)
-- These tables reference documents, so their policies need to check document ownership
-- This script ensures all policies use the fixed get_user_organization_id() function

-- Ensure get_user_organization_id() is properly set up (in case it wasn't run)
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  org_id uuid;
BEGIN
  SELECT organization_id INTO org_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_organization_id() TO anon;

-- ============================================
-- RECIPIENTS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view document recipients" ON recipients;
DROP POLICY IF EXISTS "Users can manage document recipients" ON recipients;
DROP POLICY IF EXISTS "Users can insert document recipients" ON recipients;
DROP POLICY IF EXISTS "Users can update document recipients" ON recipients;
DROP POLICY IF EXISTS "Users can delete document recipients" ON recipients;

CREATE POLICY "Users can view document recipients" ON recipients
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert document recipients" ON recipients
  FOR INSERT WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update document recipients" ON recipients
  FOR UPDATE USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete document recipients" ON recipients
  FOR DELETE USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

-- ============================================
-- FIELDS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view document fields" ON fields;
DROP POLICY IF EXISTS "Users can manage document fields" ON fields;
DROP POLICY IF EXISTS "Users can insert document fields" ON fields;
DROP POLICY IF EXISTS "Users can update document fields" ON fields;
DROP POLICY IF EXISTS "Users can delete document fields" ON fields;

CREATE POLICY "Users can view document fields" ON fields
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert document fields" ON fields
  FOR INSERT WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update document fields" ON fields
  FOR UPDATE USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete document fields" ON fields
  FOR DELETE USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

-- ============================================
-- SIGNING_SESSIONS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view signing sessions" ON signing_sessions;
DROP POLICY IF EXISTS "Users can manage signing sessions" ON signing_sessions;
DROP POLICY IF EXISTS "Users can insert signing sessions" ON signing_sessions;
DROP POLICY IF EXISTS "Users can update signing sessions" ON signing_sessions;
DROP POLICY IF EXISTS "Users can delete signing sessions" ON signing_sessions;

CREATE POLICY "Users can view signing sessions" ON signing_sessions
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert signing sessions" ON signing_sessions
  FOR INSERT WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update signing sessions" ON signing_sessions
  FOR UPDATE USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete signing sessions" ON signing_sessions
  FOR DELETE USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );
