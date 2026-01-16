-- Fix infinite recursion in documents INSERT policy
-- The issue: get_user_organization_id() can cause recursion when called from RLS policies
-- Solution: Recreate the function as plpgsql with explicit SECURITY DEFINER to bypass RLS

-- Drop and recreate get_user_organization_id() with explicit RLS bypass
DROP FUNCTION IF EXISTS get_user_organization_id() CASCADE;

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
  -- SECURITY DEFINER runs as the function owner (postgres/superuser)
  -- This completely bypasses RLS
  SELECT organization_id INTO org_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN org_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_organization_id() TO anon;

-- Drop existing documents policies
DROP POLICY IF EXISTS "Users can view org documents" ON documents;
DROP POLICY IF EXISTS "Users can manage org documents" ON documents;
DROP POLICY IF EXISTS "Users can insert org documents" ON documents;
DROP POLICY IF EXISTS "Users can update org documents" ON documents;
DROP POLICY IF EXISTS "Users can delete org documents" ON documents;

-- Policy for SELECT: Users can view documents in their organization
CREATE POLICY "Users can view org documents" ON documents
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

-- Policy for INSERT: Use the function (now properly configured to avoid recursion)
CREATE POLICY "Users can insert org documents" ON documents
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

-- Policy for UPDATE: Use the function
CREATE POLICY "Users can update org documents" ON documents
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

-- Policy for DELETE: Use the function
CREATE POLICY "Users can delete org documents" ON documents
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );
