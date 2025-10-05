# Supabase Setup Guide

This guide will help you set up Supabase to store profile data for your MedTwin application.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up or log in
2. Click "New Project"
3. Fill in your project details:
   - Name: MedTwin (or any name you prefer)
   - Database Password: Create a strong password (save this!)
   - Region: Choose the closest region to your users
4. Click "Create new project"

## 2. Create the Database Table

Once your project is created, go to the SQL Editor and run this SQL:

```sql
-- Create the profiles table
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

-- Create an index on user_id for faster lookups
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to read and write their own data
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

## 3. Get Your Supabase Credentials

1. In your Supabase project dashboard, click on the "Settings" icon (gear icon) in the sidebar
2. Go to "API" section
3. You'll find:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Configure Environment Variables

Create a `.env.local` file in the `frontend` directory with the following content:

```env
# Auth0 Configuration (you should already have these)
AUTH0_SECRET='your-existing-auth0-secret'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='your-existing-auth0-issuer'
AUTH0_CLIENT_ID='your-existing-auth0-client-id'
AUTH0_CLIENT_SECRET='your-existing-auth0-client-secret'

# Supabase Configuration (add these)
NEXT_PUBLIC_SUPABASE_URL='https://your-project-ref.supabase.co'
NEXT_PUBLIC_SUPABASE_ANON_KEY='your-anon-key-here'
```

**Important:** Replace the placeholder values with your actual Supabase credentials from step 3.

## 5. Restart Your Development Server

After adding the environment variables, restart your Next.js development server:

```bash
cd frontend
npm run dev
```

## 6. Test the Integration

1. Navigate to your profile page: `http://localhost:3000/profile`
2. Log in with Auth0 if you haven't already
3. Fill in the profile form
4. Click "Save Profile"
5. You should see a success message!

## 7. Verify Data in Supabase

1. Go to your Supabase dashboard
2. Click on "Table Editor" in the sidebar
3. Select the "profiles" table
4. You should see your saved profile data!

## Optional: Future Enhancements

### File Upload Support
The current implementation tracks the PDF filename but doesn't upload the actual file. To add file upload:

1. Set up Supabase Storage:
   - Go to Storage in your Supabase dashboard
   - Create a new bucket called "medical-records"
   - Configure appropriate access policies

2. Update the form to upload files to Supabase Storage
3. Store the file URL in a new column in the profiles table

### Additional Features
- Add a medical history table with foreign key to profiles
- Add prescription tracking
- Add appointment scheduling
- Add health metrics over time

## Troubleshooting

### "Failed to save profile" error
- Check that your environment variables are set correctly
- Verify the Supabase URL and anon key
- Check the browser console for detailed error messages

### "Unauthorized" error
- Make sure you're logged in with Auth0
- Check that your Auth0 session is valid

### Database connection issues
- Verify your Supabase project is active
- Check that the profiles table exists
- Ensure Row Level Security policies are set correctly

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Auth0 Documentation](https://auth0.com/docs)
