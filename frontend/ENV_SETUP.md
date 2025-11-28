# Environment Variables Setup Guide

## Quick Setup

1. **Create `.env.local` file** in the `frontend` directory
2. **Add your Supabase credentials** (see below)
3. **Restart your dev server**

## Getting Your Supabase Credentials

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project (or create a new one if you haven't)

### Step 2: Get API Credentials
1. In your Supabase project dashboard, click on **Settings** (gear icon in sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:

   **Project URL:**
   - Located under "Project URL" section
   - Format: `https://xxxxx.supabase.co`
   - Copy this entire URL

   **anon public key:**
   - Located under "Project API keys" section
   - Look for the key labeled "anon" with "public" scope
   - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Click the eye icon to reveal it, then copy

### Step 3: Create `.env.local` File

Create a file named `.env.local` in the `frontend` directory with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
```

**Replace:**
- `https://your-project-id.supabase.co` with your actual Project URL
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` with your actual anon public key

### Step 4: Restart Dev Server

After creating/updating `.env.local`:

```bash
# Stop the current server (Ctrl+C)
cd frontend
npm run dev
```

## File Structure

```
frontend/
├── .env.local          # Your actual credentials (gitignored)
├── .env.example        # Template file (safe to commit)
└── ENV_SETUP.md        # This guide
```

## Important Notes

- ✅ `.env.local` is automatically gitignored (won't be committed)
- ✅ Never commit your actual credentials to version control
- ✅ The `.env.example` file is a template you can safely commit
- ✅ Environment variables must start with `NEXT_PUBLIC_` to be accessible in the browser
- ✅ Restart the dev server after changing environment variables

## Troubleshooting

### "Supabase is not configured" error
- Check that `.env.local` exists in the `frontend` directory
- Verify the file has no typos in variable names
- Ensure values don't have extra spaces or quotes
- Restart your dev server

### "Failed to fetch" error
- Verify your Supabase URL is correct (should end with `.supabase.co`)
- Check that your anon key is the full key (starts with `eyJ...`)
- Ensure your Supabase project is active and not paused
- Check browser console for specific error messages

### Still having issues?
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed requests to Supabase

## Example `.env.local` File

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

**Note:** The example above uses placeholder values. Use your actual credentials from Supabase dashboard.

