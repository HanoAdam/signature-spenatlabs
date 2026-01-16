-- Diagnostic script to check current RLS policies
-- Run this to see what policies are active

-- Check if get_user_organization_id function exists
SELECT
  proname,
  prokind,
  prosecdef
FROM pg_proc
WHERE proname = 'get_user_organization_id';

-- Check all RLS policies for our tables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('users', 'documents', 'document_files', 'recipients', 'fields', 'signing_sessions', 'audit_events')
ORDER BY tablename, policyname;

-- Check if RLS is enabled on our tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('users', 'documents', 'document_files', 'recipients', 'fields', 'signing_sessions', 'audit_events')
ORDER BY tablename;