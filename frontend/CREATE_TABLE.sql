-- Run this SQL in your Supabase SQL Editor to create the profiles table
-- Go to: https://supabase.com/dashboard/project/sgsgjldgoqeffjhlqkit/sql

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

-- Create policies that allow users to read and write their own data
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (true);
