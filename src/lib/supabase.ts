import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export interface Database {
  public: {
    Tables: {
      invoices: {
        Row: {
          id: string;
          file_name: string;
          upload_date: string;
          status: string;
          extracted_fields: any;
          confidence: any;
          ocr_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          file_name: string;
          upload_date?: string;
          status: string;
          extracted_fields: any;
          confidence: any;
          ocr_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          file_name?: string;
          upload_date?: string;
          status?: string;
          extracted_fields?: any;
          confidence?: any;
          ocr_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_settings: {
        Row: {
          id: string;
          provider: string;
          openai_api_key: string | null;
          azure_api_key: string | null;
          azure_endpoint: string | null;
          azure_deployment_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider: string;
          openai_api_key?: string | null;
          azure_api_key?: string | null;
          azure_endpoint?: string | null;
          azure_deployment_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          openai_api_key?: string | null;
          azure_api_key?: string | null;
          azure_endpoint?: string | null;
          azure_deployment_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      processing_logs: {
        Row: {
          id: string;
          timestamp: string;
          message: string;
          type: string;
          invoice_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          timestamp?: string;
          message: string;
          type: string;
          invoice_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          timestamp?: string;
          message?: string;
          type?: string;
          invoice_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
}