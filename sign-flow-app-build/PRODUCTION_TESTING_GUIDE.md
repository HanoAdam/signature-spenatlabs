# Production Testing Guide

This guide helps you test your SignFlow application in production.

## Quick Production Test

Run the production test suite:

```bash
pnpm test:production
```

This will test:
- ✅ Environment variables configuration
- ✅ Supabase connection
- ✅ Database tables accessibility
- ✅ Build output

## Manual Production Testing

### 1. Test Environment Variables

Verify your environment variables are set correctly:

```bash
# Check if variables are set (in your hosting platform)
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 2. Test Supabase Connection

**Option A: Using Supabase Dashboard**
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Verify your URL and keys match your environment variables

**Option B: Test via API**
```bash
curl -X GET \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
```

### 3. Test Database Tables

In Supabase SQL Editor, run:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'organizations', 'users', 'contacts', 'documents', 
  'document_files', 'recipients', 'signing_sessions', 
  'fields', 'templates', 'template_fields', 'audit_events'
);
```

All 11 tables should be listed.

### 4. Test Application Endpoints

#### Homepage
```bash
curl https://your-domain.com/
```
Should redirect to `/auth/login` or `/dashboard`

#### Sign Up Page
```bash
curl https://your-domain.com/auth/sign-up
```
Should return HTML for sign-up page

#### API Health Check
```bash
curl https://your-domain.com/api/contacts
```
Should return JSON (401 if not authenticated, or 500 if misconfigured)

### 5. Test Authentication Flow

1. **Sign Up**
   - Go to `/auth/sign-up`
   - Create a test account
   - Verify email confirmation (if enabled)
   - Check Supabase Auth dashboard for new user

2. **Login**
   - Go to `/auth/login`
   - Log in with test account
   - Should redirect to `/dashboard`

3. **Session**
   - After login, refresh page
   - Should stay logged in
   - Check browser cookies for Supabase session

### 6. Test Database Operations

After logging in, test:

1. **Create Organization**
   - Should happen automatically on sign-up
   - Check `organizations` table in Supabase

2. **Create Contact**
   - Go to `/dashboard/contacts`
   - Create a test contact
   - Verify in `contacts` table

3. **Create Document**
   - Go to `/dashboard/documents/new`
   - Upload a PDF
   - Add recipients
   - Send for signing
   - Verify in `documents` table

### 7. Test Public Signing Flow

1. **Get Signing Link**
   - Create a document with a recipient
   - Send document
   - Get signing link from `signing_sessions` table

2. **Access Signing Page**
   ```bash
   curl https://your-domain.com/sign/[TOKEN]
   ```
   Should return signing page HTML

3. **Test Signing**
   - Open signing link in browser
   - Sign document
   - Verify signature saved in `fields` table
   - Verify recipient status updated in `recipients` table

## Automated Testing Checklist

### Pre-Deployment
- [ ] Run `pnpm test:run` - All unit tests pass
- [ ] Run `pnpm check:production` - Production readiness check passes
- [ ] Run `pnpm build` - Build succeeds without errors
- [ ] Environment variables set in hosting platform

### Post-Deployment
- [ ] Homepage loads
- [ ] Sign-up page accessible
- [ ] Login page accessible
- [ ] Can create account
- [ ] Can log in
- [ ] Dashboard loads after login
- [ ] Can create contact
- [ ] Can create document
- [ ] Can upload PDF
- [ ] Can send document for signing
- [ ] Signing link works
- [ ] Can sign document
- [ ] Document status updates correctly

## Troubleshooting

### Environment Variables Not Found

**Problem**: Tests show missing environment variables

**Solution**:
1. Verify `.env.local` exists locally
2. For production, set variables in hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Other platforms: Check their env var documentation

### Supabase Connection Failed

**Problem**: Cannot connect to Supabase

**Solution**:
1. Verify URL format: `https://[project].supabase.co`
2. Check API key is correct
3. Verify project is active in Supabase dashboard
4. Check network/firewall settings

### Database Tables Not Found

**Problem**: Tables don't exist

**Solution**:
1. Run all SQL scripts in Supabase SQL Editor:
   - `001_create_schema.sql`
   - `002_enable_rls.sql`
   - `003_public_signing_policies.sql`
   - `005_fix_org_insert_policy.sql`
2. Verify tables in Supabase Table Editor

### Authentication Not Working

**Problem**: Can't sign up or log in

**Solution**:
1. Check Supabase Auth settings:
   - Email auth enabled
   - Site URL matches your domain
   - Redirect URLs configured
2. Check browser console for errors
3. Verify environment variables are set correctly

## Production Test Script

For automated testing, use:

```bash
# Test production readiness
pnpm test:production

# Run all tests
pnpm test:run

# Check production configuration
pnpm check:production
```

## Next Steps

After successful testing:

1. ✅ Monitor application logs
2. ✅ Set up error tracking (e.g., Sentry)
3. ✅ Configure monitoring/alerting
4. ✅ Set up backups
5. ✅ Document production URLs and credentials

---

**Status**: Ready for production testing
**Last Updated**: $(date)
