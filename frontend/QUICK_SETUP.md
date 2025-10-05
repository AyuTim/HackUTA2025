# Quick Supabase Setup

## ⚠️ Current Status
Your app is running but **profile saving won't work** until you configure Supabase.

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Sign up with GitHub or email
3. Click **"New Project"**
4. Fill in:
   - Name: `medtwin` (or anything)
   - Database Password: Create a strong password (SAVE THIS!)
   - Region: Choose closest to you
5. Click **"Create new project"** (takes ~2 minutes)

### Step 2: Create Database Table
1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Paste this SQL and click **"Run"**:

```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  full_name TEXT NOT NULL,
  age INTEGER,
  height_feet INTEGER,
  height_inches INTEGER,
  weight DECIMAL(5,2),
  gender TEXT,
  blood_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (true);
```

### Step 3: Get Your API Credentials
1. Click **Settings** (gear icon) in the left sidebar
2. Click **"API"**
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJh...`
4. Keep this page open!

### Step 4: Add to .env.local
1. Open `frontend/.env.local` in your code editor
2. Add these lines (replace with YOUR actual values):

```env
NEXT_PUBLIC_SUPABASE_URL='https://YOUR-PROJECT-REF.supabase.co'
NEXT_PUBLIC_SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Step 5: Restart Dev Server
1. Stop the server: `Ctrl + C`
2. Start again: `npm run dev`
3. Go to http://localhost:3000/profile
4. Fill in the form and click **"Save Profile"**
5. ✅ You should see "Profile saved successfully!"

### Step 6: Verify It Worked
1. Go back to Supabase dashboard
2. Click **"Table Editor"** in left sidebar
3. Click on **"profiles"** table
4. You should see your saved data! 🎉

## 🔧 Troubleshooting

**"Supabase is not configured" error:**
- Check that you added BOTH variables to `.env.local`
- Make sure there are no extra spaces around the values
- Restart your dev server after adding variables

**"Failed to save profile" error:**
- Verify your Supabase URL and key are correct
- Make sure you ran the SQL to create the table
- Check the browser console for more details

**Still stuck?**
- Check `SUPABASE_SETUP.md` for more detailed instructions
- Make sure your Supabase project is active (not paused)
