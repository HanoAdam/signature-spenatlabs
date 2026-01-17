-- Download Tokens for completed documents
CREATE TABLE IF NOT EXISTS download_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES recipients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_download_tokens_token ON download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_download_tokens_document_id ON download_tokens(document_id);

-- Enable RLS
ALTER TABLE download_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read download tokens (for public download page)
CREATE POLICY "Public can read download tokens by token" ON download_tokens
  FOR SELECT
  USING (true);

-- Policy: Service role can manage download tokens
CREATE POLICY "Service role can manage download tokens" ON download_tokens
  FOR ALL
  USING (auth.role() = 'service_role');
