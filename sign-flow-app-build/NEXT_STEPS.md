# Next Steps - Testing Your Application

Congratulations! Your database is set up. Now let's test the application and get you started.

## ✅ What's Complete

- ✅ Environment variables configured
- ✅ Database schema created
- ✅ Row Level Security enabled
- ✅ Public signing policies configured
- ✅ Development server running

## 🚀 Step 1: Test User Registration

1. **Open your browser** and go to:
   ```
   http://localhost:3000/auth/sign-up
   ```
   (or port 3001 if that's what your server is using)

2. **Create your first account:**
   - Full Name: Your name
   - Organization Name: Your company/org name
   - Email: Your email address
   - Password: At least 6 characters
   - Confirm Password: Same password

3. **Important**: If email confirmation is enabled in Supabase:
   - You'll receive a confirmation email
   - Click the confirmation link
   - You'll be redirected back to the app

4. **If email confirmation is disabled** (for development):
   - You'll be redirected to `/auth/sign-up-success`
   - Then you can log in immediately

## 🔐 Step 2: Configure Supabase Authentication (If Needed)

If you encounter issues with sign-up, check your Supabase settings:

1. Go to https://app.supabase.com → Your Project
2. Navigate to **Authentication** → **Settings**
3. **Email Auth** should be enabled
4. **Confirm email** - You can disable this for development:
   - Toggle "Enable email confirmations" OFF (for testing)
   - Or keep it ON and check your email for confirmation links

5. **Site URL** should be set to:
   ```
   http://localhost:3000
   ```
   (or your actual port)

6. **Redirect URLs** should include:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3001/auth/callback
   ```

## 📝 Step 3: Test the Dashboard

After signing up and logging in:

1. **Dashboard** (`/dashboard`) - Overview of your documents
2. **Documents** (`/dashboard/documents`) - Create and manage documents
3. **Contacts** (`/dashboard/contacts`) - Manage your contacts
4. **Templates** (`/dashboard/templates`) - Create reusable templates
5. **Settings** (`/dashboard/settings`) - Configure your organization

## 🧪 Step 4: Test Core Features

### Create a Document
1. Go to `/dashboard/documents/new`
2. Upload a PDF file
3. Add recipients
4. Place signature fields
5. Send for signing

### Test Signing Flow
1. Create a document with yourself as a recipient
2. Use the signing link (you'll receive it via email if configured)
3. Sign the document
4. Verify it appears as completed

## ⚙️ Step 5: Configure Optional Services

### Email Notifications (Resend)
If you want email functionality:

1. Sign up at https://resend.com
2. Get your API key
3. Add to `.env.local`:
   ```bash
   RESEND_API_KEY=re_your_key_here
   ```
4. Restart the dev server

### File Storage (Vercel Blob)
If you need file uploads:

1. Set up Vercel Blob at https://vercel.com/docs/storage/vercel-blob
2. Get your token
3. Add to `.env.local`:
   ```bash
   BLOB_READ_WRITE_TOKEN=your_token_here
   ```
4. Restart the dev server

## 🐛 Troubleshooting

### "User already exists" error
- The user was created but profile wasn't set up
- Try logging in instead of signing up again
- Or check the `users` table in Supabase

### "Organization creation failed"
- Check that RLS policies are set up correctly
- Verify the `organizations` table exists
- Check Supabase logs for detailed errors

### Can't log in after sign-up
- Check if email confirmation is required
- Verify redirect URLs in Supabase settings
- Check browser console for errors

### Database errors
- Verify all SQL scripts ran successfully
- Check Supabase logs in the dashboard
- Ensure RLS is enabled on all tables

## 📊 Verify Database Setup

You can verify everything is set up correctly:

1. Go to Supabase Dashboard → **Table Editor**
2. You should see these tables:
   - `organizations`
   - `users`
   - `contacts`
   - `documents`
   - `document_files`
   - `recipients`
   - `signing_sessions`
   - `fields`
   - `templates`
   - `template_fields`
   - `audit_events`

3. After creating your first account, check:
   - `organizations` table should have your organization
   - `users` table should have your user record

## 🎯 Quick Test Checklist

- [ ] Can access sign-up page
- [ ] Can create an account
- [ ] Can log in (or confirm email and log in)
- [ ] Dashboard loads after login
- [ ] Can see your organization in settings
- [ ] Can navigate between dashboard pages
- [ ] No console errors in browser

## 📚 Additional Resources

- **Full Setup Guide**: See `SETUP.md`
- **Environment Variables**: See `ENV_SETUP.md`
- **Production Deployment**: See `PRODUCTION_CHECKLIST.md`

## 🎉 You're Ready!

Once you've completed these steps, your SignFlow application is fully functional and ready to use!

If you encounter any issues, check:
1. Browser console for errors
2. Terminal/server logs
3. Supabase dashboard logs
4. Network tab in browser dev tools

---

**Next**: Start creating documents and testing the full signing workflow!
