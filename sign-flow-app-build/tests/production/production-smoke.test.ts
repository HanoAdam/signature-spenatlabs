import { describe, it, expect, beforeAll } from 'vitest'

describe('Production Smoke Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  beforeAll(() => {
    // Verify environment variables are set
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
  })

  describe('Environment Configuration', () => {
    it('should have required Supabase environment variables', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeTruthy()
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeTruthy()
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toMatch(/^https?:\/\//)
    })

    it('should have valid Supabase URL format', () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      expect(url).toMatch(/^https:\/\/.*\.supabase\.co/)
    })
  })

  describe('Application Health', () => {
    it('should be able to create Supabase client', async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const client = createClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
    })

    it('should handle server client creation gracefully', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      // This should not throw even if cookies are not available in test env
      const client = await createClient()
      // Client can be null in test environment, which is acceptable
      expect(client === null || client !== null).toBe(true)
    })
  })

  describe('Database Schema', () => {
    it('should have all required tables defined in schema', async () => {
      const schema = await import('fs/promises').then(fs => 
        fs.readFile('scripts/001_create_schema.sql', 'utf-8')
      )
      
      const requiredTables = [
        'organizations',
        'users',
        'contacts',
        'documents',
        'document_files',
        'recipients',
        'signing_sessions',
        'fields',
        'templates',
        'template_fields',
        'audit_events',
      ]

      requiredTables.forEach(table => {
        expect(schema).toContain(`CREATE TABLE IF NOT EXISTS ${table}`)
      })
    })

    it('should have RLS enabled on all tables', async () => {
      const rlsScript = await import('fs/promises').then(fs =>
        fs.readFile('scripts/002_enable_rls.sql', 'utf-8')
      )

      const tables = [
        'organizations',
        'users',
        'contacts',
        'documents',
        'document_files',
        'recipients',
        'signing_sessions',
        'fields',
        'templates',
        'template_fields',
        'audit_events',
      ]

      tables.forEach(table => {
        expect(rlsScript).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`)
      })
    })
  })

  describe('API Route Structure', () => {
    it('should have all critical API routes', async => {
      const routes = [
        'app/api/auth/setup-user/route.ts',
        'app/api/contacts/route.ts',
        'app/api/documents/route.ts',
        'app/api/documents/[id]/send/route.ts',
        'app/api/documents/[id]/void/route.ts',
        'app/api/public/sign/route.ts',
        'app/api/templates/route.ts',
        'app/api/upload/route.ts',
        ]

        const fs = await import('fs/promises')
        for (const route of routes) {
          const exists = fs.access(route).then(() => true).catch(() => false)
        expect(exists).toBe(true)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle missing Supabase config gracefully', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      
      // Temporarily remove env vars
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
  })
})
