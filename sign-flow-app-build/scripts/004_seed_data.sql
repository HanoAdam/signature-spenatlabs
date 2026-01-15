-- Seed data for demo organization and template

-- Create demo organization
INSERT INTO organizations (id, name, slug, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Company',
  'demo-company',
  '{"token_expiry_days": 7, "reminder_days": [1, 3, 7]}'
) ON CONFLICT (slug) DO NOTHING;
