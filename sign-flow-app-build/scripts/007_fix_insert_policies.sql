-- Fix RLS policies to explicitly allow INSERTs with WITH CHECK clauses
-- This ensures that INSERT operations work correctly for document_files, fields, and signing_sessions

-- Fix document_files policies - add WITH CHECK for INSERTs
DROP POLICY IF EXISTS "Users can manage document files" ON document_files;
CREATE POLICY "Users can manage document files" ON document_files
  FOR ALL 
  USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

-- Fix recipients policies - add WITH CHECK for INSERTs
DROP POLICY IF EXISTS "Users can manage document recipients" ON recipients;
CREATE POLICY "Users can manage document recipients" ON recipients
  FOR ALL 
  USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

-- Fix signing_sessions policies - add WITH CHECK for INSERTs
DROP POLICY IF EXISTS "Users can manage signing sessions" ON signing_sessions;
CREATE POLICY "Users can manage signing sessions" ON signing_sessions
  FOR ALL 
  USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

-- Fix fields policies - add WITH CHECK for INSERTs
DROP POLICY IF EXISTS "Users can manage document fields" ON fields;
CREATE POLICY "Users can manage document fields" ON fields
  FOR ALL 
  USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

-- Fix documents policies - add WITH CHECK for INSERTs
DROP POLICY IF EXISTS "Users can manage org documents" ON documents;
CREATE POLICY "Users can manage org documents" ON documents
  FOR ALL 
  USING (
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
  );
