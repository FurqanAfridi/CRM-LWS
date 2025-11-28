# Authentication Setup Guide

## Profiles Table Setup

### Step 1: Run the Profiles Table SQL

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-profiles.sql`
4. Click **Run** to execute the SQL

This will create:
- `profiles` table with user profile information
- Row Level Security (RLS) policies
- Automatic profile creation trigger on user signup
- Indexes for performance

### Step 2: Enable Email Authentication in Supabase

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Email** provider
3. Configure email settings (SMTP) if you want custom emails
4. Set up email templates if needed

### Step 3: Create Your First User

#### Option A: Via Supabase Dashboard
1. Go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Enter email and password
4. The profile will be automatically created via trigger

#### Option B: Via Sign Up (if enabled)
1. Users can sign up at `/login` page
2. Profile is automatically created via trigger
3. Admin can then update user role in `profiles` table

### Step 4: Set User Roles

After creating a user, update their role in the `profiles` table:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
```

Available roles:
- `admin` - Full access
- `manager` - Management access
- `user` - Standard user access
- `sdr` - Sales Development Representative access

## Profiles Table Schema

The `profiles` table extends Supabase's `auth.users` with:

- `id` - UUID (references `auth.users.id`)
- `email` - User email (unique)
- `full_name` - User's full name
- `avatar_url` - Profile picture URL
- `role` - User role (admin, manager, user, sdr)
- `phone` - Phone number
- `department` - Department name
- `position` - Job position
- `is_active` - Account active status
- `last_login_at` - Last login timestamp
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

## Row Level Security (RLS)

The following policies are automatically created:

1. **Users can view own profile** - Users can read their own profile
2. **Users can update own profile** - Users can update their own profile
3. **Admins can view all profiles** - Admins can read all profiles
4. **Admins can update all profiles** - Admins can update all profiles

## Automatic Profile Creation

When a new user signs up via Supabase Auth, a trigger automatically:
1. Creates a profile record in `profiles` table
2. Sets email from `auth.users`
3. Sets full_name from metadata or email
4. Sets default role to 'user'

## Frontend Integration

The frontend authentication is already set up:

- **Login Page**: `/login`
- **Auth Hook**: `useAuth()` in `lib/hooks/useAuth.ts`
- **Auth Guard**: Protects dashboard routes
- **Header**: Shows user info and logout button

### Usage Example

```typescript
import { useAuth } from '@/lib/hooks/useAuth'

function MyComponent() {
  const { user, profile, signOut, isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <div>Please log in</div>
  }
  
  return (
    <div>
      <p>Welcome, {profile?.full_name}</p>
      <p>Role: {profile?.role}</p>
    </div>
  )
}
```

## Testing Authentication

1. Start your dev server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Sign in with your Supabase user credentials
4. You'll be redirected to `/dashboard` if successful

## Troubleshooting

### Profile not created automatically
- Check if the trigger `on_auth_user_created` exists
- Verify RLS policies are enabled
- Check Supabase logs for errors

### Can't sign in
- Verify email/password in Supabase Auth dashboard
- Check browser console for errors
- Ensure Supabase URL and keys are correct in `.env.local`

### RLS blocking access
- Verify user is authenticated: `SELECT auth.uid()`
- Check RLS policies are correct
- Ensure user has a profile record

