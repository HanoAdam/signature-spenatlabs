-- EMERGENCY: Temporarily disable RLS to test if it works
-- This is a temporary fix to verify the issue is RLS-related
-- DO NOT use this in production permanently

-- Disable RLS on key tables temporarily
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipients DISABLE ROW LEVEL SECURITY;
ALTER TABLE fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE signing_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events DISABLE ROW LEVEL SECURITY;

-- Note: users table RLS should remain enabled for auth
