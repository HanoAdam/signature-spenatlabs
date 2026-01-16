-- FINAL FIX for infinite recursion in RLS policies
-- The issue: SECURITY DEFINER alone doesn't bypass RLS in Supabase
-- Solution: Use direct subqueries in policies to avoid function calls that cause recursion

-- First, drop the existing function and recreate it
DROP FUNCTION IF EXISTS get_user_organization_id() CASCADE;

-- Create a simpler function that just returns the organization_id
-- The key is that this function is SECURITY DEFINER and owned by postgres
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1;
$$;

-- Ensure function is executable
GRANT EXECUTE ON FUNCTION get_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_organization_id() TO anon;

-- ============================================
-- FIX USERS TABLE POLICIES FIRST
-- This is the root cause of recursion
-- ============================================

-- Drop all user policies and recreate with non-recursive versions
DROP POLICY IF EXISTS "Users can view themselves" ON users;
DROP POLICY IF EXISTS "Users can view org members" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Users can insert themselves" ON users;

-- Users can always see themselves - simple, no recursion
CREATE POLICY "Users can view themselves" ON users
  FOR SELECT USING (id = auth.uid());

-- Users can update themselves
CREATE POLICY "Users can update themselves" ON users
  FOR UPDATE USING (id = auth.uid());

-- Users can insert themselves  
CREATE POLICY "Users can insert themselves" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================
-- FIX DOCUMENTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view org documents" ON documents;
DROP POLICY IF EXISTS "Users can manage org documents" ON documents;
DROP POLICY IF EXISTS "Users can insert org documents" ON documents;
DROP POLICY IF EXISTS "Users can update org documents" ON documents;
DROP POLICY IF EXISTS "Users can delete org documents" ON documents;

-- SELECT: Check organization_id directly 
CREATE POLICY "Users can view org documents" ON documents
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- INSERT: Check organization_id matches user's org
CREATE POLICY "Users can insert org documents" ON documents
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- UPDATE: Check organization_id
CREATE POLICY "Users can update org documents" ON documents
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- DELETE: Check organization_id
CREATE POLICY "Users can delete org documents" ON documents
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- FIX DOCUMENT_FILES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view document files" ON document_files;
DROP POLICY IF EXISTS "Users can manage document files" ON document_files;
DROP POLICY IF EXISTS "Users can insert document files" ON document_files;
DROP POLICY IF EXISTS "Users can update document files" ON document_files;
DROP POLICY IF EXISTS "Users can delete document files" ON document_files;

CREATE POLICY "Users can view document files" ON document_files
  FOR SELECT USING (
    document_id IN (
      SELECT d.id FROM documents d 
      WHERE d.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert document files" ON document_files
  FOR INSERT WITH CHECK (
    document_id IN (
      SELECT d.id FROM documents d 
      WHERE d.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update document files" ON document_files
  FOR UPDATE USING (
    document_id IN (
      SELECT d.id FROM documents d 
      WHERE d.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete document files" ON document_files
  FOR DELETE USING (
    document_id IN (
      SELECT d.id FROM documents d 
      WHERE d.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- ============================================
-- FIX RECIPIENTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view document recipients" ON recipients;
DROP POLICY IF EXISTS "Users can manage document recipients" ON recipients;
DROP POLICY IF EXISTS "Users can insert document recipients" ON recipients;
DROP POLICY IF EXISTS "Users can update document recipients" ON recipients;
DROP POLICY IF EXISTS "Users can delete document recipients" ON recipients;

CREATE POLICY "Users can view document recipients" ON recipients
  FOR SELECT USING (
    document_id IN (
      SELECT d.id FROM documents d 
      WHERE d.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert document recipients" ON recipients
  FOR INSERT WITH CHECK (
    document_id IN (
      SELECT d.id FROM documents d 
      WHERE d.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update document recipients" ON recipients
  FOR UPDATE USING (
    document_id IN (
      SELECT d.id FROM documents d 
      WHERE d.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete document recipients" ON recipients
  FOR DELETE USING (
    document_id IN (
      SELECT d.id FROM documents d 
      WHERE d.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- ============================================
-- FIX FIELDS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view document fields" ON fields;
DROP POLICY IF EXISTS "Users can manage document fields" ON fields;
DROP POLICY IF EXISTS "Users can insert document fields" ON fields;
DROP POLICY IF EXISTS "Users can update document fields" ON fields;
DROP POLICY IF EXISTS "Users can delete document fields" ON fields;

CREATE POLICY "Users can view document fields" ON fields
  FOR SELECT USING (
    document_id IN (
      SELECT d.id FROM documents d 
      WHERE d.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert document fields" ON fields
  FOR INSERT WITH CHECK (
    document_id IN (
      SELECT d.id FROM documents d 
      WHERE d.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update document fields" ON fields
  FOR UPDATE USING (
    document_id IN (
      SELECT d.id FROM documents d 
      WHERE d.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete document fields" ON fields
  FOR DELETE USING (
    document_id IN (
      SELECT d.id FROM documents d 
      WHERE d.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- ============================================
-- FIX SIGNING_SESSIONS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view signing sessions" ON signing_sessions;
DROP POLICY IF EXISTS "Users can manage signing sessions" ON signing_sessions;
DROP POLICY IF EXISTS "Users can insert signing sessions" ON signing_sessions;
DROP POLICY IF EXISTS "Users can update signing sessions" ON signing_sessions;
DROP POLICY IF EXISTS "Users can delete signing sessions" ON signing_sessions;

CREATE POLICY "Users can view signing sessions" ON signing_sessions
  FOR SELECT USING (
    document_id IN (
      SELECT d.id FROM documents d 
      WHERE d.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert signing sessions" ON signing_sessions
  FOR INSERT WITH CHECK (
    document_id IN (
      SELECT d.id FROM documents d 
      WHERE d.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update signing sessions" ON signing_sessions
  FOR UPDATE USING (
    document_id IN (
      SELECT d.id FROM documents d 
      WHERE d.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete signing sessions" ON signing_sessions
  FOR DELETE USING (
    document_id IN (
      SELECT d.id FROM documents d 
      WHERE d.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- ============================================
-- FIX AUDIT_EVENTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view org audit events" ON audit_events;
DROP POLICY IF EXISTS "Users can insert audit events" ON audit_events;

CREATE POLICY "Users can view org audit events" ON audit_events
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert audit events" ON audit_events
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
