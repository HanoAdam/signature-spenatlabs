import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/client'

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createClient', () => {
    it('should throw error when environment variables are missing', () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      expect(() => createClient()).toThrow('Missing Supabase environment variables')

      // Restore
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
    })

    it('should create client when environment variables are present', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

      const client = createClient()
      expect(client).toBeDefined()
    })

    it('should use fallback environment variables', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      process.env.SUPABASE_URL = 'https://fallback.supabase.co'
      process.env.SUPABASE_ANON_KEY = 'fallback-key'

      const client = createClient()
      expect(client).toBeDefined()

      // Cleanup
      delete process.env.SUPABASE_URL
      delete process.env.SUPABASE_ANON_KEY
    })
  })
})
