-- Fix document_files RLS policy to allow INSERTs
-- The issue: The WITH CHECK clause needs to properly verify the document belongs to user's org
-- Since we've fixed get_user_organization_id(), we can use it safely now

-- Drop existing document_files policies
DROP POLICY IF EXISTS "Users can view document files" ON document_files;
DROP POLICY IF EXISTS "Users can manage document files" ON document_files;

-- Policy for SELECT: Users can view document files for documents in their organization
CREATE POLICY "Users can view document files" ON document_files
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

-- Policy for INSERT: Check that the document exists and belongs to user's organization
-- This uses the fixed get_user_organization_id() function which bypasses RLS
CREATE POLICY "Users can insert document files" ON document_files
  FOR INSERT WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

-- Policy for UPDATE: Users can update files for documents in their organization
CREATE POLICY "Users can update document files" ON document_files
  FOR UPDATE USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );

-- Policy for DELETE: Users can delete files for documents in their organization
CREATE POLICY "Users can delete document files" ON document_files
  FOR DELETE USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id = get_user_organization_id()
    )
  );
