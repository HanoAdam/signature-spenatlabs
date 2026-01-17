import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Production Readiness Checks', () => {
  describe('Environment Variables', () => {
    it('should have required Supabase environment variables documented', () => {
      const envSetup = readFileSync(join(process.cwd(), 'ENV_SETUP.md'), 'utf-8')
      expect(envSetup).toContain('NEXT_PUBLIC_SUPABASE_URL')
      expect(envSetup).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    })

    it('should have production checklist document', () => {
      const checklist = readFileSync(join(process.cwd(), 'PRODUCTION_CHECKLIST.md'), 'utf-8')
      expect(checklist).toBeTruthy()
      expect(checklist.length).toBeGreaterThan(0)
    })
  })

  describe('Database Scripts', () => {
    const requiredScripts = [
      '001_create_schema.sql',
      '002_enable_rls.sql',
      '003_public_signing_policies.sql',
      '005_fix_org_insert_policy.sql',
    ]

    requiredScripts.forEach((script) => {
      it(`should have ${script}`, () => {
        const scriptPath = join(process.cwd(), 'scripts', script)
        const content = readFileSync(scriptPath, 'utf-8')
        expect(content).toBeTruthy()
        expect(content.length).toBeGreaterThan(0)
      })
    })

    it('should have idempotent RLS policies', () => {
      const rlsScript = readFileSync(join(process.cwd(), 'scripts/002_enable_rls.sql'), 'utf-8')
      // Check that policies use DROP IF EXISTS
      expect(rlsScript).toContain('DROP POLICY IF EXISTS')
    })

    it('should have idempotent public policies', () => {
      const publicScript = readFileSync(
        join(process.cwd(), 'scripts/003_public_signing_policies.sql'),
        'utf-8',
      )
      expect(publicScript).toContain('DROP POLICY IF EXISTS')
    })
  })

  describe('Package Configuration', () => {
    it('should have build script', () => {
      const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'))
      expect(packageJson.scripts.build).toBeDefined()
      expect(packageJson.scripts.build).toBe('next build')
    })

    it('should have start script for production', () => {
      const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'))
      expect(packageJson.scripts.start).toBeDefined()
      expect(packageJson.scripts.start).toBe('next start')
    })

    it('should have required dependencies', () => {
      const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'))
      expect(packageJson.dependencies.next).toBeDefined()
      expect(packageJson.dependencies['@supabase/ssr']).toBeDefined()
      expect(packageJson.dependencies['@supabase/supabase-js']).toBeDefined()
    })
  })

  describe('TypeScript Configuration', () => {
    it('should have tsconfig.json', () => {
      const tsconfig = JSON.parse(readFileSync(join(process.cwd(), 'tsconfig.json'), 'utf-8'))
      expect(tsconfig.compilerOptions).toBeDefined()
      expect(tsconfig.compilerOptions.strict).toBe(true)
    })
  })

  describe('Documentation', () => {
    const requiredDocs = [
      'README.md',
      'SETUP.md',
      'ENV_SETUP.md',
      'PRODUCTION_CHECKLIST.md',
    ]

    requiredDocs.forEach((doc) => {
      it(`should have ${doc}`, () => {
        const docPath = join(process.cwd(), doc)
        const content = readFileSync(docPath, 'utf-8')
        expect(content).toBeTruthy()
        expect(content.length).toBeGreaterThan(100) // At least some content
      })
    })
  })
})
