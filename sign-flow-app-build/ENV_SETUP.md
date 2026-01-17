# Environment Variables Setup

This application requires environment variables to be configured. Create a `.env.local` file in the root directory with the following variables:

## Required Variables

### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**How to get these:**
1. Go to your Supabase project: https://app.supabase.com
2. Navigate to Settings → API
3. Copy the "Project URL" and "anon public" key

## Optional Variables

### Supabase Service Role Key
```bash
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
**Note:** This is needed for admin operations. Never expose this in client-side code.

### Resend API Key (for email functionality)
```bash
RESEND_API_KEY=your_resend_api_key
```
**How to get this:**
1. Sign up at https://resend.com
2. Go to API Keys section
3. Create a new API key

### Vercel Blob Storage (for file uploads)
```bash
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```
**How to get this:**
1. Go to https://vercel.com/docs/storage/vercel-blob
2. Create a blob store and get the token

## Example `.env.local` file

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
RESEND_API_KEY=re_your_resend_key_here
BLOB_READ_WRITE_TOKEN=vercel_blob_token_here
```

## Quick Start

1. Copy the example above to `.env.local`
2. Fill in your Supabase credentials (required)
3. Add optional services as needed
4. Restart your development server

The application will work without the optional variables, but some features (like email sending or file uploads) will be disabled.
