-- Fix missing INSERT policy for organizations
-- Run this script to allow new users to create organizations

-- First drop the policy if it exists (to avoid errors)
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

-- Create the INSERT policy for organizations
CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
