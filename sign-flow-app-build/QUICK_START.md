# Quick Start Guide

Get SignFlow up and running in 5 minutes!

## 1. Environment Setup ✅

You've already created `.env.local` with your Supabase credentials. Great!

## 2. Database Setup (Required)

**IMPORTANT**: You must set up your database before the app will work properly.

### Quick Setup Steps:

1. Go to https://app.supabase.com
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Run these SQL files **in order**:

   ```
   scripts/001_create_schema.sql
   scripts/002_enable_rls.sql
   scripts/003_public_signing_policies.sql
   scripts/005_fix_org_insert_policy.sql
   ```

5. (Optional) Run `scripts/004_seed_data.sql` for demo data

### How to Run SQL Files:

- Copy the contents of each file
- Paste into the SQL Editor
- Click "Run" or press Cmd/Ctrl + Enter
- Verify success (green checkmark)

## 3. Development Server ✅

The server is already running! You can access it at:
- **http://localhost:3000** (or check the port shown in terminal)

## 4. Test the Application

1. **Create an Account**
   - Go to `/auth/sign-up`
   - Create your first user account
   - The system will automatically create an organization for you

2. **Access Dashboard**
   - After sign-up, you'll be redirected to `/dashboard`
   - Start creating documents and managing contacts!

## 5. Optional: Configure Additional Services

### Email (Resend)
- Sign up at https://resend.com
- Get your API key
- Add to `.env.local`: `RESEND_API_KEY=your_key`

### File Storage (Vercel Blob)
- Set up at https://vercel.com/docs/storage/vercel-blob
- Add to `.env.local`: `BLOB_READ_WRITE_TOKEN=your_token`

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` exists in the root directory
- Verify variable names are correct (no typos)
- Restart the dev server after adding variables

### "Server configuration error"
- Verify your Supabase URL and keys are correct
- Check that database setup scripts have been run

### Database errors
- Ensure all SQL scripts have been run in order
- Check Supabase project is active
- Verify RLS policies are enabled

## Next Steps

- Read [SETUP.md](SETUP.md) for detailed setup instructions
- Check [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) before deploying
- Review [ENV_SETUP.md](ENV_SETUP.md) for environment variable details

## Need Help?

- Check the documentation files in the root directory
- Review Supabase logs in your project dashboard
- Check browser console for client-side errors

---

**You're all set!** 🎉

Your development server is running and ready to use. Just make sure to complete the database setup step above.
