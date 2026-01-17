import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data: unknown, init?: { status?: number }) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get: vi.fn((key: string) => {
      if (key === 'x-forwarded-for') return '127.0.0.1'
      if (key === 'user-agent') return 'test-agent'
      return null
    }),
  })),
}))

// Mock email utilities
const mockSendEmail = vi.fn()
const mockGenerateCompletionEmail = vi.fn()

vi.mock('@/lib/utils/email', () => ({
  sendEmail: mockSendEmail,
  generateCompletionEmail: mockGenerateCompletionEmail,
}))

// Create a proper Supabase mock that handles chaining
const createSupabaseMock = () => {
  const mockChain: any = {
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }

  const mockFrom = vi.fn((table: string) => {
    // Return a new chain for each table
    const chain = { ...mockChain }
    
    // Setup specific behaviors based on table
    if (table === 'signing_sessions') {
      chain.select = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'session-1',
              token: 'test-token',
              recipient_id: 'recipient-1',
              document_id: 'doc-1',
              expires_at: new Date(Date.now() + 86400000).toISOString(),
              recipients: {
                id: 'recipient-1',
                name: 'Signer 1',
                email: 'signer1@example.com',
                status: 'sent',
              },
              documents: {
                id: 'doc-1',
                title: 'Test Document',
                status: 'pending',
                organization_id: 'org-1',
                recipients: [
                  { id: 'recipient-1', role: 'signer' },
                  { id: 'recipient-2', role: 'signer' },
                ],
              },
            },
            error: null,
          }),
        })),
      }))
    } else if (table === 'recipients') {
      chain.select = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({
          data: [
            { id: 'recipient-1', email: 'signer1@example.com', name: 'Signer 1', status: 'signed' },
            { id: 'recipient-2', email: 'signer2@example.com', name: 'Signer 2', status: 'signed' },
            { id: 'recipient-3', email: 'cc@example.com', name: 'CC Recipient', role: 'cc', status: 'sent' },
          ],
          error: null,
        }),
      }))
      chain.update = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }))
    } else if (table === 'document_files') {
      chain.select = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { url: 'https://example.com/signed-document.pdf', filename: 'signed-doc.pdf', size_bytes: 1024 * 1024 },
              error: null,
            }),
          })),
        })),
      }))
    } else if (table === 'documents') {
      chain.select = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { created_by: 'creator-user-id' },
            error: null,
          }),
        })),
      }))
      chain.update = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }))
    } else if (table === 'fields') {
      chain.update = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      }))
    } else if (table === 'users') {
      chain.select = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { email: 'creator@example.com', full_name: 'Document Creator' },
            error: null,
          }),
        })),
      }))
    } else if (table === 'audit_events') {
      chain.insert = vi.fn().mockResolvedValue({ data: null, error: null })
    }
    
    return chain
  })

  return {
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
      }),
    },
  }
}

const mockSupabaseClient = createSupabaseMock()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabaseClient),
}))

describe('Completion Email Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockSendEmail.mockResolvedValue({ success: true })
    mockGenerateCompletionEmail.mockReturnValue({
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<html>Test</html>',
    })
  })

  describe('When all parties sign', () => {
    it('should send completion emails to all recipients when document is completed', async () => {
      // Import the route handler
      const { POST } = await import('@/app/api/public/sign/route')

      // Call the route handler
      const request = new Request('http://localhost/api/public/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'test-token',
          fieldValues: { 'field-1': 'value-1' },
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      // Verify the response
      expect(result.success).toBe(true)
      expect(result.documentCompleted).toBe(true)

      // Verify completion emails were generated for all recipients (2 signers + 1 CC + 1 creator = 4)
      expect(mockGenerateCompletionEmail).toHaveBeenCalledTimes(4)

      // Verify email was sent to each recipient
      expect(mockSendEmail).toHaveBeenCalledTimes(4)

      // Verify email content includes document title and download URL
      expect(mockGenerateCompletionEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientName: expect.any(String),
          recipientEmail: expect.any(String),
          documentTitle: 'Test Document',
          downloadLink: expect.stringContaining('https://signature.spenatlabs.com/download/'),
        })
      )
    })

    it('should send completion emails even if download URL is not available', async () => {
      // Create a new mock client with no document file
      const mockClientNoFile = createSupabaseMock()
      const originalFrom = mockClientNoFile.from
      mockClientNoFile.from = vi.fn((table: string) => {
        if (table === 'document_files') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                })),
              })),
            })),
          }
        }
        // Use original mock for other tables
        return originalFrom(table)
      })
      
      // Replace the mock client
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(mockClientNoFile as any)

      const { POST } = await import('@/app/api/public/sign/route')

      const request = new Request('http://localhost/api/public/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'test-token',
          fieldValues: { 'field-1': 'value-1' },
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.documentCompleted).toBe(true)

      // Verify emails are still sent even without download URL (3 recipients + 1 creator = 4)
      expect(mockSendEmail).toHaveBeenCalledTimes(4)
      // Check that at least one call had undefined downloadUrl
      const calls = mockGenerateCompletionEmail.mock.calls
      const hasUndefinedUrl = calls.some((call) => call[0].downloadUrl === undefined)
      expect(hasUndefinedUrl).toBe(true)
    })

    it('should continue sending emails even if one fails', async () => {
      // Mock one email failing
      let callCount = 0
      mockSendEmail.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({ success: false, error: 'Email service error' })
        }
        return Promise.resolve({ success: true })
      })

      const { POST } = await import('@/app/api/public/sign/route')

      const request = new Request('http://localhost/api/public/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'test-token',
          fieldValues: { 'field-1': 'value-1' },
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.documentCompleted).toBe(true)

      // Verify all emails were attempted (even if one failed) (3 recipients + 1 creator = 4)
      expect(mockSendEmail).toHaveBeenCalledTimes(4)
    })
  })
})
