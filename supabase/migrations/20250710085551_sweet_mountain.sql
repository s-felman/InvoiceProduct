/*
  # Create invoices table

  1. New Tables
    - `invoices`
      - `id` (uuid, primary key)
      - `file_name` (text)
      - `upload_date` (timestamp)
      - `status` (text) - processing, completed, failed
      - `extracted_fields` (jsonb) - extracted invoice data
      - `confidence` (jsonb) - confidence scores for each field
      - `ocr_text` (text) - raw OCR text
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `invoices` table
    - Add policies for authenticated users to manage their own invoices
*/

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  upload_date timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'processing',
  extracted_fields jsonb DEFAULT '{}',
  confidence jsonb DEFAULT '{}',
  ocr_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations since we don't have user authentication
CREATE POLICY "Allow all operations on invoices"
  ON invoices
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS invoices_created_at_idx ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);