# Supabase Migration Guide

This guide walks through migrating from Manus OAuth + Forge services to Supabase.

## ✅ What's Been Implemented

### 1. Supabase Client Setup
- **Backend**: `backend/server/_core/supabase.ts` - Admin client with service role
- **Frontend**: `frontend/client/src/lib/supabase.ts` - Client with anon key

### 2. Authentication System
- **Backend**: `backend/server/_core/supabaseAuth.ts` - Auth routes and middleware
  - `POST /api/auth/session` - Exchange Supabase token for cookie
  - `POST /api/auth/signout` - Clear session
  - `GET /api/auth/me` - Get current user
  - `requireAuth()` middleware for protected routes

- **Frontend**: `frontend/client/src/hooks/useSupabaseAuth.ts` - Auth hook
  - Email/password authentication
  - OAuth (Google, GitHub)
  - Password reset
  - Auto-sync with backend cookies

### 3. Storage System
- **Backend**: `backend/server/_core/supabaseStorage.ts` - Storage helpers
  - `uploadFile()` - Upload images to Supabase Storage
  - `deleteFile()` / `deleteFiles()` - Delete images
  - `getPublicUrl()` - Get public URL for images
  - `createSignedUrl()` - Create temporary signed URLs
  - `initializeBucket()` - Initialize storage bucket

## 📋 Setup Steps

### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Create new project: `tattoo-shops`
3. Copy credentials to `.env`:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_KEY=eyJh...
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
```

### Step 2: Set Up Supabase Database

Your existing database schema works with Supabase! Just need to:

1. Go to Supabase Dashboard > Database > Connection
2. Copy connection string
3. Update `DATABASE_URL` in `.env` to point to Supabase:

```env
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

4. Run migrations:
```bash
pnpm db:push
```

### Step 3: Enable Authentication Providers

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable providers you want:
   - ✅ **Email** (enabled by default)
   - ✅ **Google**: Add OAuth credentials
   - ✅ **GitHub**: Add OAuth credentials
   - ✅ **Magic Link**: Passwordless email login

3. Configure redirect URLs:
   - Add: `http://localhost:5173/auth/callback`
   - Add: `https://yourdomain.com/auth/callback`

### Step 4: Set Up Storage Bucket

Run this once to initialize the storage bucket:

```typescript
// In your server startup or migration script
import { initializeBucket } from './backend/server/_core/supabaseStorage';

await initializeBucket();
```

Or manually create bucket in Supabase Dashboard:
1. Go to Storage > Create bucket
2. Name: `portfolio-images`
3. Public: ✅ Yes
4. File size limit: 5MB
5. Allowed MIME types: `image/jpeg, image/png, image/jpg, image/webp`

### Step 5: Set Up Row Level Security (RLS)

Apply these policies in Supabase SQL Editor:

```sql
-- Enable RLS on your tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id);

-- Artists can update their own profile
CREATE POLICY "Artists can update own profile"
  ON artists FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Users can view all approved artists
CREATE POLICY "Anyone can view approved artists"
  ON artists FOR SELECT
  USING (is_approved = 1);

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid()::text = user_id);

-- Artists can view bookings for their profile
CREATE POLICY "Artists can view their bookings"
  ON bookings FOR SELECT
  USING (
    artist_id IN (
      SELECT id FROM artists WHERE user_id = auth.uid()::text
    )
  );

-- Storage policies for portfolio images
CREATE POLICY "Public can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-images');

CREATE POLICY "Artists can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolio-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Artists can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'portfolio-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 🔄 Migration Steps

### Update Backend

1. **Replace authentication in index.ts**:

```typescript
// OLD (Manus OAuth)
import { registerOAuthRoutes } from './_core/oauth';
registerOAuthRoutes(app);

// NEW (Supabase Auth)
import { registerSupabaseAuthRoutes } from './_core/supabaseAuth';
registerSupabaseAuthRoutes(app);
```

2. **Update tRPC context to use Supabase auth**:

```typescript
// backend/server/_core/context.ts
import { supabaseAdmin } from './supabase';

export async function createContext({ req, res }: { req: Request; res: Response }) {
  const token = req.cookies[COOKIE_NAME];
  
  if (!token) {
    return { user: null };
  }

  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  
  return {
    user: user ? {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0],
    } : null,
  };
}
```

3. **Replace storage calls**:

```typescript
// OLD (Manus Forge)
import { storagePut } from './storage';
await storagePut('path/to/file', buffer, 'image/jpeg', 'filename.jpg');

// NEW (Supabase Storage)
import { uploadFile } from './_core/supabaseStorage';
const url = await uploadFile('path/to/file', buffer, 'image/jpeg');
```

### Update Frontend

1. **Replace auth hook**:

```typescript
// OLD (Manus)
import { useAuth } from '@/_core/hooks/useAuth';
const { userInfo } = useAuth();

// NEW (Supabase)
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
const { user, signInWithEmail, signOut } = useSupabaseAuth();
```

2. **Create auth callback page** (`frontend/client/src/pages/AuthCallback.tsx`):

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'wouter';
import { supabase } from '@/lib/supabase';

export function AuthCallback() {
  const [, navigate] = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  return <div>Loading...</div>;
}
```

3. **Update login component**:

```typescript
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export function Login() {
  const { signInWithEmail, signInWithOAuth } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleEmailLogin() {
    try {
      await signInWithEmail(email, password);
      // Redirect handled by auth state change
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  async function handleGoogleLogin() {
    try {
      await signInWithOAuth('google');
    } catch (error) {
      console.error('OAuth failed:', error);
    }
  }

  return (
    <div>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleEmailLogin}>Sign In</button>
      <button onClick={handleGoogleLogin}>Sign In with Google</button>
    </div>
  );
}
```

## 🧹 Cleanup Old Manus Code

After migration is complete and tested, remove:

### Files to Delete
```bash
# Backend
rm backend/server/_core/oauth.ts
rm backend/server/_core/sdk.ts
rm backend/server/_core/types/manusTypes.ts
rm backend/server/storage.ts  # Old Forge storage
rm backend/server/_core/notification.ts  # Manus notifications
rm backend/server/_core/dataApi.ts  # If not used

# Frontend
rm frontend/client/src/components/ManusDialog.tsx
rm frontend/client/src/_core/hooks/useAuth.ts  # Old Manus auth hook
```

### Packages to Remove
```bash
pnpm remove vite-plugin-manus-runtime
```

### Update vite.config.ts
Remove Manus plugin and domain allowlist:

```typescript
// REMOVE
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

const plugins = [
  react(), 
  tailwindcss(), 
  jsxLocPlugin(),
  // vitePluginManusRuntime()  // REMOVE THIS
];

// REMOVE allowed domains
server: {
  proxy: {
    "/api": {
      // ... keep this
    },
  },
  // REMOVE cors.origin array with .manus domains
},
```

### Update Database Schema
Remove `openId` field if you're using Supabase auth IDs:

```sql
-- Migrate user IDs from openId to Supabase auth.uid
-- Run carefully in production!
ALTER TABLE users ADD COLUMN supabase_id UUID;
-- Map existing users, then:
ALTER TABLE users DROP COLUMN open_id;
```

## 🧪 Testing Checklist

- [ ] Can sign up with email/password
- [ ] Can sign in with email/password
- [ ] Can sign in with Google OAuth
- [ ] Can sign out
- [ ] Can reset password
- [ ] Can upload portfolio images
- [ ] Can view uploaded images (public URLs work)
- [ ] Can delete images
- [ ] Protected API routes require authentication
- [ ] RLS policies prevent unauthorized access

## 🚨 Important Notes

1. **User ID Migration**: Supabase uses UUID for `auth.uid()`. If your existing database uses different IDs (like Manus `openId`), you'll need to migrate:
   - Add `supabase_id` column to users table
   - Map existing users to Supabase auth users
   - Update foreign keys

2. **Email Templates**: Customize Supabase auth emails:
   - Go to Dashboard > Authentication > Email Templates
   - Update: Confirmation, Password Reset, Magic Link templates

3. **Rate Limiting**: Supabase has built-in rate limiting. For production:
   - Configure in Dashboard > Settings > API
   - Add custom rate limiting if needed

4. **Storage CDN**: Supabase Storage uses CDN. Images are automatically cached and served from edge locations.

5. **Database Migrations**: Continue using Drizzle for schema management. Supabase is just the hosting provider.

## 💡 Migration Tips

1. **Parallel Run**: Keep both systems running temporarily
2. **Feature Flags**: Use env vars to toggle between Manus/Supabase
3. **Test Locally**: Test thoroughly with Supabase dev project
4. **Backup Data**: Export Manus data before switching
5. **Monitor**: Watch Supabase logs during migration

## 📚 Resources

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Supabase Storage Docs: https://supabase.com/docs/guides/storage
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
