/*
  # Create processing logs table

  1. New Tables
    - `processing_logs`
      - `id` (uuid, primary key)
      - `timestamp` (timestamp)
      - `message` (text)
      - `type` (text) - info, success, error, warning
      - `invoice_id` (uuid, nullable, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `processing_logs` table
    - Add policies for managing processing logs

  3. Foreign Keys
    - Link to invoices table
*/

CREATE TABLE IF NOT EXISTS processing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE processing_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations on processing logs
CREATE POLICY "Allow all operations on processing_logs"
  ON processing_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS processing_logs_timestamp_idx ON processing_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS processing_logs_invoice_id_idx ON processing_logs(invoice_id);
CREATE INDEX IF NOT EXISTS processing_logs_type_idx ON processing_logs(type);