# SignFlow Setup Guide

This guide will help you set up SignFlow for both development and production.

## Prerequisites

- Node.js 18+ and pnpm installed
- A Supabase account and project
- (Optional) Resend account for email functionality
- (Optional) Vercel Blob Storage for file uploads

## Step 1: Environment Variables

Create a `.env.local` file in the root directory with your credentials:

```bash
# Required - Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional - Supabase Service Role (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional - Email Service (Resend)
RESEND_API_KEY=re_your_resend_key_here

# Optional - File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=vercel_blob_token_here
```

See `ENV_SETUP.md` for detailed instructions on obtaining these credentials.

## Step 2: Database Setup

You need to run the SQL scripts in your Supabase project to set up the database schema.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Run each script in order:
   - `scripts/001_create_schema.sql` - Creates all tables
   - `scripts/002_enable_rls.sql` - Enables Row Level Security
   - `scripts/003_public_signing_policies.sql` - Sets up public signing access
   - `scripts/005_fix_org_insert_policy.sql` - Fixes organization insert policy
   - `scripts/004_seed_data.sql` - (Optional) Adds demo data

### Option B: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db reset
# Then run each SQL file in order
```

## Step 3: Install Dependencies

```bash
pnpm install
```

## Step 4: Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000` (or the next available port).

## Step 5: Create Your First User

1. Navigate to `/auth/sign-up`
2. Create an account
3. The system will automatically create an organization for you

## Production Deployment

### Build for Production

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (if needed)
   - `RESEND_API_KEY` (if using email)
   - `BLOB_READ_WRITE_TOKEN` (if using file uploads)
4. Deploy

### Environment Variables for Production

Make sure to set all required environment variables in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Other platforms: Follow their environment variable configuration guide

## Troubleshooting

### Database Connection Issues

- Verify your Supabase URL and keys are correct
- Check that all SQL scripts have been run successfully
- Ensure Row Level Security policies are set up correctly

### Authentication Issues

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Check Supabase project settings for authentication configuration
- Ensure email authentication is enabled in Supabase Auth settings

### File Upload Issues

- Verify `BLOB_READ_WRITE_TOKEN` is set if using Vercel Blob
- Check file size limits
- Ensure CORS is configured correctly

### Email Issues

- Verify `RESEND_API_KEY` is set
- Check Resend domain verification
- Review email sending limits

## Next Steps

- Configure your organization settings
- Set up email templates
- Configure file storage
- Set up custom domain (if needed)
