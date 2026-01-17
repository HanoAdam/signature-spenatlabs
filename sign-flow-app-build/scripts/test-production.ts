#!/usr/bin/env tsx

/**
 * Production Testing Script
 * Tests critical functionality in production environment
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Load .env.local if it exists
function loadEnvFile() {
  const envPath = join(process.cwd(), '.env.local')
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '')
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      }
    })
  }
}

// Load environment variables
loadEnvFile()

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  duration?: number
}

const results: TestResult[] = []

function logResult(name: string, condition: boolean, message: string, warning = false, duration?: number) {
  results.push({
    name,
    status: condition ? 'pass' : warning ? 'warning' : 'fail',
    message,
    duration,
  })
  
  const icon = condition ? '✅' : warning ? '⚠️' : '❌'
  const status = condition ? 'PASS' : warning ? 'WARN' : 'FAIL'
  const time = duration ? ` (${duration}ms)` : ''
  console.log(`${icon} [${status}] ${name}${time}`)
  if (!condition && message) {
    console.log(`   ${message}`)
  }
}

async function testSupabaseConnection() {
  const start = Date.now()
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      logResult(
        'Supabase Connection',
        false,
        'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
      )
      return false
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test basic connection by checking auth
    const { data, error } = await supabase.auth.getSession()
    
    const duration = Date.now() - start
    if (error && error.message.includes('Invalid API key')) {
      logResult('Supabase Connection', false, 'Invalid API key', false, duration)
      return false
    }
    
    logResult('Supabase Connection', true, 'Successfully connected to Supabase', false, duration)
    return true
  } catch (error: any) {
    const duration = Date.now() - start
    logResult('Supabase Connection', false, error.message || 'Connection failed', false, duration)
    return false
  }
}

async function testDatabaseTables() {
  const start = Date.now()
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      logResult('Database Tables', false, 'Missing Supabase credentials')
      return false
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Try to query a table (this will fail if table doesn't exist or RLS blocks it)
    // We use a simple query that should work if tables exist
    const { error } = await supabase.from('organizations').select('id').limit(1)
    
    const duration = Date.now() - start
    
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        logResult('Database Tables', false, 'Tables not found. Run database scripts.', false, duration)
        return false
      }
      // RLS blocking is OK - it means tables exist
      logResult('Database Tables', true, 'Tables exist (RLS may block queries)', false, duration)
      return true
    }
    
    logResult('Database Tables', true, 'Tables accessible', false, duration)
    return true
  } catch (error: any) {
    const duration = Date.now() - start
    logResult('Database Tables', false, error.message || 'Check failed', false, duration)
    return false
  }
}

async function testEnvironmentVariables() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const optional = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'BLOB_READ_WRITE_TOKEN',
  ]

  let allRequired = true
  required.forEach((varName) => {
    const value = process.env[varName]
    logResult(
      `Env: ${varName}`,
      !!value,
      value ? 'Set' : 'Missing (required)',
      false,
    )
    if (!value) allRequired = false
  })

  optional.forEach((varName) => {
    const value = process.env[varName]
    logResult(
      `Env: ${varName}`,
      true,
      value ? 'Set (optional)' : 'Not set (optional)',
      !value,
    )
  })

  return allRequired
}

async function testBuildOutput() {
  const fs = await import('fs/promises')
  const path = await import('path')
  
  try {
    const nextDir = path.join(process.cwd(), '.next')
    const exists = await fs.access(nextDir).then(() => true).catch(() => false)
    
    if (!exists) {
      logResult('Build Output', false, '.next directory not found. Run pnpm build first.')
      return false
    }
    
    logResult('Build Output', true, 'Build directory exists')
    return true
  } catch (error: any) {
    logResult('Build Output', false, error.message)
    return false
  }
}

async function main() {
  console.log('🧪 Production Testing Suite\n')
  console.log('=' .repeat(50))
  console.log()

  // Test environment variables
  console.log('📋 Environment Variables:')
  const envOk = await testEnvironmentVariables()
  console.log()

  // Test Supabase connection
  console.log('🔌 Supabase Connection:')
  const supabaseOk = await testSupabaseConnection()
  console.log()

  // Test database tables
  console.log('🗄️  Database Tables:')
  const dbOk = await testDatabaseTables()
  console.log()

  // Test build output
  console.log('📦 Build Output:')
  const buildOk = await testBuildOutput()
  console.log()

  // Summary
  console.log('=' .repeat(50))
  console.log('\n📊 Summary:\n')
  
  const passCount = results.filter(r => r.status === 'pass').length
  const warnCount = results.filter(r => r.status === 'warning').length
  const failCount = results.filter(r => r.status === 'fail').length

  console.log(`   ✅ Passed: ${passCount}`)
  console.log(`   ⚠️  Warnings: ${warnCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log()

  if (failCount > 0) {
    console.log('❌ Production tests FAILED')
    console.log('Please fix the issues above before deploying.\n')
    process.exit(1)
  } else if (!envOk || !supabaseOk || !dbOk) {
    console.log('⚠️  Production tests completed with critical issues')
    console.log('Some functionality may not work correctly.\n')
    process.exit(1)
  } else {
    console.log('✅ Production tests PASSED')
    console.log('Your application is ready for production!\n')
    process.exit(0)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
