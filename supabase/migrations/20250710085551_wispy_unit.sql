/*
  # Create AI settings table

  1. New Tables
    - `ai_settings`
      - `id` (text, primary key) - single row with id '1'
      - `provider` (text) - openai, azure, none
      - `openai_api_key` (text, nullable)
      - `azure_api_key` (text, nullable)
      - `azure_endpoint` (text, nullable)
      - `azure_deployment_name` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `ai_settings` table
    - Add policies for managing AI settings
*/

CREATE TABLE IF NOT EXISTS ai_settings (
  id text PRIMARY KEY DEFAULT '1',
  provider text NOT NULL DEFAULT 'none',
  openai_api_key text,
  azure_api_key text,
  azure_endpoint text,
  azure_deployment_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations on AI settings
CREATE POLICY "Allow all operations on ai_settings"
  ON ai_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert default settings
INSERT INTO ai_settings (id, provider) VALUES ('1', 'none') ON CONFLICT (id) DO NOTHING;