# Production Deployment Checklist

Use this checklist to ensure your SignFlow application is ready for production.

## Pre-Deployment

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (for admin operations)
- [ ] `RESEND_API_KEY` is set (if using email)
- [ ] `BLOB_READ_WRITE_TOKEN` is set (if using file uploads)

### Database Setup
- [ ] All SQL scripts have been run in Supabase:
  - [ ] `001_create_schema.sql` - Tables created
  - [ ] `002_enable_rls.sql` - RLS enabled
  - [ ] `003_public_signing_policies.sql` - Public policies set
  - [ ] `005_fix_org_insert_policy.sql` - Insert policy fixed
- [ ] Database indexes are created
- [ ] Row Level Security policies are active

### Supabase Configuration
- [ ] Email authentication is enabled
- [ ] Email templates are configured (if using custom templates)
- [ ] CORS is configured for your domain
- [ ] API rate limits are set appropriately
- [ ] Database backups are enabled

### Application Configuration
- [ ] Build completes without errors: `pnpm build`
- [ ] All TypeScript errors are resolved
- [ ] Environment variables are validated
- [ ] Error handling is in place

## Deployment Platform Setup

### Vercel (Recommended)
- [ ] Project is connected to Git repository
- [ ] Environment variables are set in Vercel dashboard
- [ ] Build command: `pnpm build`
- [ ] Output directory: `.next`
- [ ] Node.js version: 18.x or higher
- [ ] Custom domain is configured (if applicable)
- [ ] SSL certificate is active

### Other Platforms
- [ ] Environment variables are configured
- [ ] Build process is set up correctly
- [ ] Static assets are served correctly
- [ ] API routes are working
- [ ] Server-side rendering is functioning

## Post-Deployment

### Testing
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Dashboard loads for authenticated users
- [ ] Document upload works
- [ ] Document creation works
- [ ] Email sending works (if configured)
- [ ] File storage works (if configured)
- [ ] Public signing links work
- [ ] Signature collection works

### Security
- [ ] HTTPS is enabled
- [ ] Environment variables are not exposed in client-side code
- [ ] API routes are protected
- [ ] Row Level Security is working correctly
- [ ] CORS is configured properly

### Performance
- [ ] Page load times are acceptable
- [ ] Images are optimized
- [ ] Database queries are optimized
- [ ] API response times are acceptable

### Monitoring
- [ ] Error tracking is set up (e.g., Sentry)
- [ ] Analytics are configured (if needed)
- [ ] Logging is configured
- [ ] Uptime monitoring is set up

## Optional Enhancements

### Email Configuration
- [ ] Custom email domain is verified in Resend
- [ ] Email templates are customized
- [ ] Email sending limits are understood

### File Storage
- [ ] File size limits are configured
- [ ] File retention policies are set
- [ ] CDN is configured (if applicable)

### Customization
- [ ] Branding is updated (logo, colors)
- [ ] Custom domain is configured
- [ ] Email sender name is customized

## Rollback Plan

- [ ] Previous deployment is tagged/backed up
- [ ] Database migrations are reversible (if any)
- [ ] Rollback procedure is documented

## Support & Documentation

- [ ] User documentation is available
- [ ] Admin documentation is available
- [ ] Support contact information is available
- [ ] FAQ is created (if needed)

## Maintenance

- [ ] Regular backup schedule is set
- [ ] Update schedule is planned
- [ ] Security update process is defined
- [ ] Monitoring alerts are configured

---

## Quick Production Commands

```bash
# Build for production
pnpm build

# Test production build locally
pnpm start

# Check for TypeScript errors
pnpm lint

# Verify environment variables
# (Check your deployment platform's environment variable settings)
```

## Troubleshooting

If you encounter issues:

1. Check environment variables are set correctly
2. Verify database setup is complete
3. Check application logs in your deployment platform
4. Verify Supabase project is active and accessible
5. Check network connectivity and CORS settings
