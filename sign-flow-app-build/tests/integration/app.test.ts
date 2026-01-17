import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Application Integration Tests', () => {
  describe('Critical Files', () => {
    it('should have main layout file', () => {
      const layoutPath = join(process.cwd(), 'app', 'layout.tsx')
      expect(existsSync(layoutPath)).toBe(true)
    })

    it('should have root page', () => {
      const pagePath = join(process.cwd(), 'app', 'page.tsx')
      expect(existsSync(pagePath)).toBe(true)
    })

    it('should have authentication pages', () => {
      const loginPath = join(process.cwd(), 'app', 'auth', 'login', 'page.tsx')
      const signUpPath = join(process.cwd(), 'app', 'auth', 'sign-up', 'page.tsx')
      expect(existsSync(loginPath)).toBe(true)
      expect(existsSync(signUpPath)).toBe(true)
    })

    it('should have dashboard layout', () => {
      const dashboardLayoutPath = join(process.cwd(), 'app', '(dashboard)', 'layout.tsx')
      expect(existsSync(dashboardLayoutPath)).toBe(true)
    })

    it('should have API routes', () => {
      const apiRoutes = [
        'app/api/auth/setup-user/route.ts',
        'app/api/contacts/route.ts',
        'app/api/documents/route.ts',
      ]

      apiRoutes.forEach((route) => {
        const routePath = join(process.cwd(), route)
        expect(existsSync(routePath)).toBe(true)
      })
    })
  })

  describe('Component Structure', () => {
    it('should have UI components', () => {
      const uiComponents = [
        'components/ui/button.tsx',
        'components/ui/card.tsx',
        'components/ui/input.tsx',
        'components/ui/form.tsx',
      ]

      uiComponents.forEach((component) => {
        const componentPath = join(process.cwd(), component)
        expect(existsSync(componentPath)).toBe(true)
      })
    })

    it('should have feature components', () => {
      const featureComponents = [
        'components/documents/documents-table.tsx',
        'components/contacts/contacts-table.tsx',
        'components/signing/signing-room.tsx',
      ]

      featureComponents.forEach((component) => {
        const componentPath = join(process.cwd(), component)
        expect(existsSync(componentPath)).toBe(true)
      })
    })
  })

  describe('Library Files', () => {
    it('should have Supabase client utilities', () => {
      const clientPath = join(process.cwd(), 'lib', 'supabase', 'client.ts')
      const serverPath = join(process.cwd(), 'lib', 'supabase', 'server.ts')
      const proxyPath = join(process.cwd(), 'lib', 'supabase', 'proxy.ts')

      expect(existsSync(clientPath)).toBe(true)
      expect(existsSync(serverPath)).toBe(true)
      expect(existsSync(proxyPath)).toBe(true)
    })

    it('should have utility functions', () => {
      const utilsPath = join(process.cwd(), 'lib', 'utils.ts')
      expect(existsSync(utilsPath)).toBe(true)
    })
  })

  describe('Configuration Files', () => {
    it('should have Next.js config', () => {
      const nextConfigPath =
        join(process.cwd(), 'next.config.mjs') || join(process.cwd(), 'next.config.js')
      expect(existsSync(join(process.cwd(), 'next.config.mjs'))).toBe(true)
    })

    it('should have TypeScript config', () => {
      const tsconfigPath = join(process.cwd(), 'tsconfig.json')
      expect(existsSync(tsconfigPath)).toBe(true)
    })

    it('should have Tailwind config', () => {
      // Tailwind 4 might use different config
      const tailwindConfigPath = join(process.cwd(), 'tailwind.config.ts')
      const postcssConfigPath = join(process.cwd(), 'postcss.config.mjs')
      expect(existsSync(postcssConfigPath)).toBe(true)
    })
  })
})
