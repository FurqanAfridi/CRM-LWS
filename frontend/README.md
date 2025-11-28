# CRM - LWS Frontend

Customer Relationship Management system for Lincoln Waste Solutions.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see [Environment Setup](#environment-setup))

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment Setup

### Quick Setup

1. Create `.env.local` file in the `frontend` directory
2. Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** (under "Project URL" section)
   - **anon public key** (under "Project API keys" → "anon" → click eye icon to reveal)

### Using Setup Scripts

**Windows PowerShell:**
```powershell
.\create-env.ps1
```

This will prompt you for your Supabase credentials and create the `.env.local` file automatically.

### After Setting Up Environment Variables

**IMPORTANT:** Next.js only reads `.env.local` when the server starts. After creating or modifying the file:

1. Stop the dev server (Ctrl+C)
2. Restart: `npm run dev`
3. Hard refresh your browser (Ctrl+Shift+R)

If you're having issues, use the force restart script:
```powershell
.\force-restart.ps1
```

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── login/             # Login page
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── lib/                   # Library code
│   ├── hooks/            # Custom React hooks
│   ├── supabase/         # Supabase client and queries
│   └── utils/            # Utility functions
└── public/               # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Troubleshooting

### Environment Variables Not Loading

If you see "Environment Variables Not Loaded" on the login page:

1. Verify `.env.local` exists in the `frontend` directory
2. Check file format (no spaces around `=`, no quotes)
3. Stop the dev server completely
4. Delete `.next` cache: `Remove-Item -Recurse -Force .next`
5. Restart: `npm run dev`
6. Hard refresh browser (Ctrl+Shift+R)

### Common Issues

- **"Supabase is not configured"**: Environment variables not loaded - restart server
- **"Failed to fetch"**: Check Supabase URL and internet connection
- **Login button disabled**: Environment variables not loaded - see above

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **UI Components**: Custom components with Tailwind

## License

Private - Lincoln Waste Solutions

