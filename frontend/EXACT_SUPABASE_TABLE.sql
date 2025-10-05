
DROP TABLE IF EXISTS profiles CASCADE;

-- Create the profiles table with exact column names
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  full_name TEXT NOT NULL,
  age INTEGER,
  height_feet INTEGER,
  height_inches INTEGER,
  weight NUMERIC(5,2),
  gender TEXT,
  blood_type TEXT,
  medical_record_url TEXT,
  medical_record_filename TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for now)
CREATE POLICY "Enable read access for all users" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Enable insert access for all users" 
  ON profiles FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users" 
  ON profiles FOR UPDATE 
  USING (true);

CREATE POLICY "Enable delete access for all users" 
  ON profiles FOR DELETE 
  USING (true);

-- Verify the table was created correctly
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
