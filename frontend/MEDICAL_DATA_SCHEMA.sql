-- Enhanced schema for AI-parsed medical data

-- Update profiles table with AI processing fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS medical_record_url TEXT,
ADD COLUMN IF NOT EXISTS medical_record_filename TEXT,
ADD COLUMN IF NOT EXISTS medical_data JSONB,  -- Store the full Gemini JSON output
ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMPTZ,  -- When the document was processed
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';  -- pending, processing, completed, failed

-- Create a table for storing extracted medical conditions
CREATE TABLE IF NOT EXISTS medical_conditions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  condition_name TEXT NOT NULL,
  diagnosis_date DATE,
  severity TEXT,  -- mild, moderate, severe
  status TEXT,  -- active, resolved, chronic
  notes TEXT,
  source_document_url TEXT,  -- Reference to the PDF it came from
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Create a table for medications
CREATE TABLE IF NOT EXISTS medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  prescribing_doctor TEXT,
  purpose TEXT,
  source_document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Create a table for allergies
CREATE TABLE IF NOT EXISTS allergies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  allergen TEXT NOT NULL,
  reaction TEXT,
  severity TEXT,  -- mild, moderate, severe
  discovered_date DATE,
  source_document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Create a table for lab results/vitals
CREATE TABLE IF NOT EXISTS lab_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  test_name TEXT NOT NULL,
  test_date DATE,
  result_value TEXT,
  unit TEXT,
  reference_range TEXT,
  status TEXT,  -- normal, abnormal, critical
  notes TEXT,
  source_document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Create a table for procedures/surgeries
CREATE TABLE IF NOT EXISTS procedures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  procedure_date DATE,
  doctor TEXT,
  hospital TEXT,
  outcome TEXT,
  notes TEXT,
  source_document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_conditions_user_id ON medical_conditions(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_allergies_user_id ON allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_user_id ON lab_results(user_id);
CREATE INDEX IF NOT EXISTS idx_procedures_user_id ON procedures(user_id);

-- Enable RLS on new tables
ALTER TABLE medical_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, customize based on your auth)
CREATE POLICY "Enable read access for all users" ON medical_conditions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON medical_conditions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON medical_conditions FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON medical_conditions FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON medications FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON medications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON medications FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON medications FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON allergies FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON allergies FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON allergies FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON allergies FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON lab_results FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lab_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lab_results FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lab_results FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON procedures FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON procedures FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON procedures FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON procedures FOR DELETE USING (true);
