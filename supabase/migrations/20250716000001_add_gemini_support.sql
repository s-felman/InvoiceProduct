/*
  # Add Gemini support to AI settings

  1. Changes
    - Add `gemini_api_key` column to `ai_settings` table
    - Update provider check constraint to include 'gemini'

  2. Security
    - Existing RLS policies remain unchanged
*/

-- Add gemini_api_key column to ai_settings table
ALTER TABLE ai_settings ADD COLUMN IF NOT EXISTS gemini_api_key text;

-- Add a check constraint to ensure provider is one of the valid options
ALTER TABLE ai_settings DROP CONSTRAINT IF EXISTS provider_check;
ALTER TABLE ai_settings ADD CONSTRAINT provider_check 
  CHECK (provider IN ('none', 'openai', 'azure', 'gemini'));
