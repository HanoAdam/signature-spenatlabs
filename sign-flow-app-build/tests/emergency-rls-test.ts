import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@/lib/supabase/server'

// Emergency test for RLS disabled state
// This test verifies document creation works when RLS is disabled

describe('Emergency RLS Test - Document Creation', () => {
  let testDocumentId: string

  it('should create document without RLS restrictions', async () => {
    const supabase = await createClient()

    // Create a test document
    const testData = {
      organization_id: 'test-org-id', // This would normally fail with RLS
      created_by: 'test-user-id',
      title: 'Emergency RLS Test Document',
      description: 'Testing document creation with RLS disabled',
      status: 'draft',
      signing_order: 'parallel'
    }

    const { data, error } = await supabase
      .from('documents')
      .insert(testData)
      .select()
      .single()

    if (error) {
      console.error('Document creation error:', error)
    }

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.title).toBe(testData.title)

    if (data) {
      testDocumentId = data.id
    }
  })

  it('should create document file without RLS restrictions', async () => {
    if (!testDocumentId) {
      console.warn('Skipping file test - no document created')
      return
    }

    const supabase = await createClient()

    const fileData = {
      document_id: testDocumentId,
      file_type: 'original',
      url: 'https://example.com/test.pdf',
      filename: 'test.pdf',
      page_count: 1
    }

    const { data, error } = await supabase
      .from('document_files')
      .insert(fileData)
      .select()
      .single()

    if (error) {
      console.error('File creation error:', error)
    }

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.filename).toBe(fileData.filename)
  })

  it('should create recipients without RLS restrictions', async () => {
    if (!testDocumentId) {
      console.warn('Skipping recipients test - no document created')
      return
    }

    const supabase = await createClient()

    const recipientData = {
      document_id: testDocumentId,
      name: 'Test Recipient',
      email: 'test@example.com',
      role: 'signer',
      signing_order: 1,
      status: 'pending'
    }

    const { data, error } = await supabase
      .from('recipients')
      .insert(recipientData)
      .select()
      .single()

    if (error) {
      console.error('Recipient creation error:', error)
    }

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.email).toBe(recipientData.email)
  })

  afterAll(async () => {
    // Clean up test data
    if (testDocumentId) {
      const supabase = await createClient()

      // Clean up in reverse order (foreign key constraints)
      await supabase.from('recipients').delete().eq('document_id', testDocumentId)
      await supabase.from('document_files').delete().eq('document_id', testDocumentId)
      await supabase.from('documents').delete().eq('id', testDocumentId)

      console.log('Test data cleaned up')
    }
  })
})