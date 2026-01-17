import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

// Mock Supabase SSR
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((url: string, key: string) => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}))

describe('Supabase Server Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createClient', () => {
    it('should return null when environment variables are missing', async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const client = await createClient()
      expect(client).toBeNull()

      // Restore
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
    })

    it('should create client when environment variables are present', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

      const client = await createClient()
      expect(client).not.toBeNull()
      expect(client).toBeDefined()
    })

    it('should use fallback environment variables', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      process.env.SUPABASE_URL = 'https://fallback.supabase.co'
      process.env.SUPABASE_ANON_KEY = 'fallback-key'

      const client = await createClient()
      expect(client).not.toBeNull()

      // Cleanup
      delete process.env.SUPABASE_URL
      delete process.env.SUPABASE_ANON_KEY
    })

    it('should return correct type', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

      const client = await createClient()
      expect(client).toBeDefined()
      // Type check - client should have auth property if not null
      if (client) {
        expect(client.auth).toBeDefined()
      }
    })
  })
})
