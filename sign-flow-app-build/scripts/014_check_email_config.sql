-- Check if email-related tables and data exist
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename IN ('signing_sessions', 'recipients', 'documents')
ORDER BY tablename;

-- Check recent documents and recipients
SELECT
  d.id,
  d.title,
  d.status,
  d.created_at,
  COUNT(r.id) as recipient_count,
  COUNT(ss.id) as session_count
FROM documents d
LEFT JOIN recipients r ON r.document_id = d.id
LEFT JOIN signing_sessions ss ON ss.document_id = d.id
WHERE d.created_at > NOW() - INTERVAL '1 hour'
GROUP BY d.id, d.title, d.status, d.created_at
ORDER BY d.created_at DESC
LIMIT 5;