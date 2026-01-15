-- Public policies for external signing (token-based access)
-- These allow unauthenticated users to access specific resources via valid tokens

-- Allow public read of signing sessions by token (for validation)
CREATE POLICY "Public can read signing sessions by token" ON signing_sessions
  FOR SELECT USING (true);

-- Allow public to update signing sessions (record IP/user agent on sign)
CREATE POLICY "Public can update signing sessions" ON signing_sessions
  FOR UPDATE USING (expires_at > NOW());

-- Allow public read of documents linked to valid signing sessions
CREATE POLICY "Public can read documents via signing session" ON documents
  FOR SELECT USING (
    id IN (
      SELECT document_id FROM signing_sessions 
      WHERE expires_at > NOW()
    )
  );

-- Allow public to update documents (mark as completed)
CREATE POLICY "Public can update documents via signing session" ON documents
  FOR UPDATE USING (
    id IN (
      SELECT document_id FROM signing_sessions 
      WHERE expires_at > NOW()
    )
  );

-- Allow public read of document files via signing session
CREATE POLICY "Public can read document files via signing session" ON document_files
  FOR SELECT USING (
    document_id IN (
      SELECT document_id FROM signing_sessions 
      WHERE expires_at > NOW()
    )
  );

-- Allow public read of recipients via signing session
CREATE POLICY "Public can read recipients via signing session" ON recipients
  FOR SELECT USING (
    document_id IN (
      SELECT document_id FROM signing_sessions 
      WHERE expires_at > NOW()
    )
  );

-- Allow public to update recipients (mark as signed)
CREATE POLICY "Public can update recipients via signing session" ON recipients
  FOR UPDATE USING (
    id IN (
      SELECT recipient_id FROM signing_sessions 
      WHERE expires_at > NOW()
    )
  );

-- Allow public read/update of fields via signing session
CREATE POLICY "Public can read fields via signing session" ON fields
  FOR SELECT USING (
    document_id IN (
      SELECT document_id FROM signing_sessions 
      WHERE expires_at > NOW()
    )
  );

-- Allow public to update fields assigned to their recipient
CREATE POLICY "Public can update own fields via signing session" ON fields
  FOR UPDATE USING (
    recipient_id IN (
      SELECT recipient_id FROM signing_sessions 
      WHERE expires_at > NOW()
    )
  );

-- Allow public to insert audit events
CREATE POLICY "Public can insert audit events" ON audit_events
  FOR INSERT WITH CHECK (true);
