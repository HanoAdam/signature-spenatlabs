import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Critical User Flows', () => {
  describe('Authentication Flow', () => {
    it('should have sign-up page', () => {
      const signUpPath = join(process.cwd(), 'app', 'auth', 'sign-up', 'page.tsx')
      expect(existsSync(signUpPath)).toBe(true)
    })

    it('should have login page', () => {
      const loginPath = join(process.cwd(), 'app', 'auth', 'login', 'page.tsx')
      expect(existsSync(loginPath)).toBe(true)
    })

    it('should have auth callback handler', () => {
      const callbackPath = join(process.cwd(), 'app', 'auth', 'callback', 'route.ts')
      expect(existsSync(callbackPath)).toBe(true)
    })

    it('should have login actions', () => {
      const loginActionsPath = join(process.cwd(), 'app', 'auth', 'login', 'actions.ts')
      expect(existsSync(loginActionsPath)).toBe(true)
    })
  })

  describe('Document Flow', () => {
    it('should have document creation page', () => {
      const newDocPath = join(process.cwd(), 'app', '(dashboard)', 'documents', 'new', 'page.tsx')
      expect(existsSync(newDocPath)).toBe(true)
    })

    it('should have document list page', () => {
      const docsPath = join(process.cwd(), 'app', '(dashboard)', 'documents', 'page.tsx')
      expect(existsSync(docsPath)).toBe(true)
    })

    it('should have document detail page', () => {
      const docDetailPath = join(process.cwd(), 'app', '(dashboard)', 'documents', '[id]', 'page.tsx')
      expect(existsSync(docDetailPath)).toBe(true)
    })

    it('should have document API routes', () => {
      const apiRoutes = [
        'app/api/documents/route.ts',
        'app/api/documents/[id]/send/route.ts',
        'app/api/documents/[id]/void/route.ts',
      ]

      apiRoutes.forEach((route) => {
        const routePath = join(process.cwd(), route)
        expect(existsSync(routePath)).toBe(true)
      })
    })
  })

  describe('Signing Flow', () => {
    it('should have public signing page', () => {
      const signingPath = join(process.cwd(), 'app', 'sign', '[token]', 'page.tsx')
      expect(existsSync(signingPath)).toBe(true)
    })

    it('should have signing API route', () => {
      const signingApiPath = join(process.cwd(), 'app', 'api', 'public', 'sign', 'route.ts')
      expect(existsSync(signingApiPath)).toBe(true)
    })

    it('should have signing components', () => {
      const signingRoomPath = join(process.cwd(), 'components', 'signing', 'signing-room.tsx')
      const signatureModalPath = join(process.cwd(), 'components', 'signing', 'signature-modal.tsx')
      expect(existsSync(signingRoomPath)).toBe(true)
      expect(existsSync(signatureModalPath)).toBe(true)
    })
  })

  describe('Contact Management Flow', () => {
    it('should have contacts page', () => {
      const contactsPath = join(process.cwd(), 'app', '(dashboard)', 'contacts', 'page.tsx')
      expect(existsSync(contactsPath)).toBe(true)
    })

    it('should have contacts API route', () => {
      const contactsApiPath = join(process.cwd(), 'app', 'api', 'contacts', 'route.ts')
      expect(existsSync(contactsApiPath)).toBe(true)
    })
  })
})
