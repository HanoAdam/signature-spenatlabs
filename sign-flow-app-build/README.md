# SignFlow - E-Signature Application

A modern, full-featured electronic signature application built with Next.js, React, and Supabase.

## Features

- 📝 Document Management - Upload, organize, and track documents
- ✍️ Digital Signatures - Collect signatures from multiple parties
- 📧 Email Notifications - Automated email reminders and notifications
- 👥 Contact Management - Manage recipients and contacts
- 📊 Audit Trail - Complete audit log of all document activities
- 🎨 Templates - Create reusable document templates
- 🔒 Security - Row-level security and token-based signing

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd sign-flow-app-build
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   - Copy `.env.local.example` to `.env.local` (or create it)
   - Add your Supabase credentials
   - See `ENV_SETUP.md` for details

4. **Set up the database**
   - Run the SQL scripts in your Supabase project
   - See `SETUP.md` for detailed instructions

5. **Start development server**
   ```bash
   pnpm dev
   ```

## Documentation

- [Environment Setup](ENV_SETUP.md) - Configure environment variables
- [Setup Guide](SETUP.md) - Complete setup instructions
- [Database Scripts](scripts/) - SQL scripts for database setup

## Tech Stack

- **Framework**: Next.js 16
- **UI**: React 19, Tailwind CSS, Radix UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Vercel Blob
- **Email**: Resend
- **PDF**: react-pdf

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── sign/              # Public signing pages
├── components/            # React components
├── lib/                   # Utilities and helpers
├── scripts/               # Database setup scripts
└── public/                # Static assets
```

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## Production Deployment

See `SETUP.md` for production deployment instructions.

## License

Private - All rights reserved
