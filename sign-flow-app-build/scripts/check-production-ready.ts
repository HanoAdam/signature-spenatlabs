#!/usr/bin/env node

/**
 * Production Readiness Check Script
 * Verifies that the application is ready for production deployment
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
}

const results: CheckResult[] = []

function check(name: string, condition: boolean, message: string, warning = false) {
  results.push({
    name,
    status: condition ? 'pass' : warning ? 'warning' : 'fail',
    message,
  })
}

console.log('🔍 Checking Production Readiness...\n')

// Check environment variables documentation
const envSetupExists = existsSync(join(process.cwd(), 'ENV_SETUP.md'))
check('Environment Setup Documentation', envSetupExists, 'ENV_SETUP.md exists')

// Check required database scripts
const requiredScripts = [
  '001_create_schema.sql',
  '002_enable_rls.sql',
  '003_public_signing_policies.sql',
  '005_fix_org_insert_policy.sql',
]

requiredScripts.forEach((script) => {
  const exists = existsSync(join(process.cwd(), 'scripts', script))
  check(`Database Script: ${script}`, exists, `${script} exists`)
})

// Check package.json scripts
try {
  const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'))
  check('Build Script', !!packageJson.scripts?.build, 'Build script exists')
  check('Start Script', !!packageJson.scripts?.start, 'Start script exists')
  check('Next.js Dependency', !!packageJson.dependencies?.next, 'Next.js is installed')
  check('Supabase SSR', !!packageJson.dependencies?.['@supabase/ssr'], 'Supabase SSR is installed')
} catch (error) {
  check('Package.json', false, `Error reading package.json: ${error}`)
}

// Check TypeScript configuration
const tsconfigExists = existsSync(join(process.cwd(), 'tsconfig.json'))
check('TypeScript Config', tsconfigExists, 'tsconfig.json exists')

// Check documentation
const docs = ['README.md', 'SETUP.md', 'PRODUCTION_CHECKLIST.md']
docs.forEach((doc) => {
  const exists = existsSync(join(process.cwd(), doc))
  check(`Documentation: ${doc}`, exists, `${doc} exists`)
})

// Check Next.js config
const nextConfigExists =
  existsSync(join(process.cwd(), 'next.config.mjs')) ||
  existsSync(join(process.cwd(), 'next.config.js'))
check('Next.js Config', nextConfigExists, 'Next.js config exists')

// Print results
console.log('\n📊 Results:\n')
let passCount = 0
let failCount = 0
let warnCount = 0

results.forEach((result) => {
  const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
  const status = result.status.toUpperCase().padEnd(7)
  console.log(`${icon} [${status}] ${result.name}`)
  if (result.message && result.status !== 'pass') {
    console.log(`   ${result.message}`)
  }

  if (result.status === 'pass') passCount++
  else if (result.status === 'warning') warnCount++
  else failCount++
})

console.log(`\n📈 Summary:`)
console.log(`   ✅ Passed: ${passCount}`)
console.log(`   ⚠️  Warnings: ${warnCount}`)
console.log(`   ❌ Failed: ${failCount}`)

if (failCount > 0) {
  console.log('\n❌ Production readiness check FAILED')
  console.log('Please fix the issues above before deploying to production.\n')
  process.exit(1)
} else if (warnCount > 0) {
  console.log('\n⚠️  Production readiness check passed with warnings')
  console.log('Review warnings before deploying to production.\n')
  process.exit(0)
} else {
  console.log('\n✅ Production readiness check PASSED')
  console.log('Your application is ready for production deployment!\n')
  process.exit(0)
}
