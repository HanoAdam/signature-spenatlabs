import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { RecentDocuments } from '@/components/documents/recent-documents'
import type { Document, Recipient, DocumentFile } from '@/lib/types'

// Mock external dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('RecentDocuments', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  const mockDocuments: Array<Document & { recipients?: Recipient[]; document_files?: DocumentFile[] }> = [
    {
      id: 'doc-1',
      title: 'Test Document 1',
      status: 'completed',
      created_at: '2024-01-15T10:00:00Z',
      organization_id: 'org-1',
      created_by: 'user-1',
      recipients: [
        {
          id: 'recipient-1',
          name: 'John Doe',
          email: 'john@example.com',
          status: 'signed',
          signed_at: '2024-01-16T10:00:00Z',
          role: 'signer',
          document_id: 'doc-1',
          signing_order: 1,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-16T10:00:00Z',
        },
        {
          id: 'recipient-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          status: 'pending',
          role: 'signer',
          document_id: 'doc-1',
          signing_order: 2,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
      ],
      document_files: [
        {
          id: 'file-1',
          document_id: 'doc-1',
          file_type: 'signed',
          url: 'https://example.com/signed.pdf',
          filename: 'signed-document.pdf',
          created_at: '2024-01-15T10:00:00Z',
        },
      ],
    },
  ]

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<RecentDocuments documents={mockDocuments} />)
      expect(screen.getByText('Recent Documents')).toBeInTheDocument()
    })

    it('should render empty state when no documents', () => {
      render(<RecentDocuments documents={[]} />)
      expect(screen.getByText('No documents yet')).toBeInTheDocument()
    })

    it('should render document title and status', () => {
      render(<RecentDocuments documents={mockDocuments} />)
      expect(screen.getByText('Test Document 1')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('should render signer status summary', () => {
      render(<RecentDocuments documents={mockDocuments} />)
      expect(screen.getByText('1 signed, 1 pending')).toBeInTheDocument()
    })

    it('should render action button', () => {
      render(<RecentDocuments documents={mockDocuments} />)
      // Look for button with MoreHorizontal icon (the three dots menu)
      const actionButton = screen.getByRole('button', { name: '' })
      expect(actionButton).toBeInTheDocument()
      // Verify it has the correct attributes
      expect(actionButton).toHaveAttribute('aria-haspopup', 'menu')
    })
  })
})