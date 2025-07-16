import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { InvoiceData, AISettings, ProcessingLog } from '../types';
import { supabase } from '../lib/supabase';

interface AppState {
  invoices: InvoiceData[];
  aiSettings: AISettings;
  processingLogs: ProcessingLog[];
  loading: boolean;
  error: string | null;
}

type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INVOICES'; payload: InvoiceData[] }
  | { type: 'ADD_INVOICE'; payload: InvoiceData }
  | { type: 'UPDATE_INVOICE'; payload: InvoiceData }
  | { type: 'SET_AI_SETTINGS'; payload: AISettings }
  | { type: 'SET_PROCESSING_LOGS'; payload: ProcessingLog[] }
  | { type: 'ADD_LOG'; payload: ProcessingLog };

const initialState: AppState = {
  invoices: [],
  aiSettings: { provider: 'none' },
  processingLogs: [],
  loading: false,
  error: null
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INVOICES':
      return { ...state, invoices: action.payload };
    case 'ADD_INVOICE':
      return { ...state, invoices: [action.payload, ...state.invoices] };
    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map(inv =>
          inv.id === action.payload.id ? action.payload : inv
        )
      };
    case 'SET_AI_SETTINGS':
      return { ...state, aiSettings: action.payload };
    case 'SET_PROCESSING_LOGS':
      return { ...state, processingLogs: action.payload };
    case 'ADD_LOG':
      return { ...state, processingLogs: [action.payload, ...state.processingLogs] };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    // Load initial data
    loadInvoices();
    loadAISettings();
    loadProcessingLogs();
  }, []);

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const invoices = data?.map(row => ({
        id: row.id,
        fileName: row.file_name,
        uploadDate: new Date(row.upload_date),
        status: row.status as 'processing' | 'completed' | 'failed',
        extractedFields: row.extracted_fields,
        confidence: row.confidence,
        ocrText: row.ocr_text
      })) || [];
      
      dispatch({ type: 'SET_INVOICES', payload: invoices });
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadAISettings = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        const settings: AISettings = {
          provider: data.provider as 'openai' | 'azure' | 'gemini' | 'none',
          openaiApiKey: data.openai_api_key || undefined,
          azureApiKey: data.azure_api_key || undefined,
          azureEndpoint: data.azure_endpoint || undefined,
          azureDeploymentName: data.azure_deployment_name || undefined,
          geminiApiKey: data.gemini_api_key || undefined
        };
        dispatch({ type: 'SET_AI_SETTINGS', payload: settings });
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
    }
  };

  const loadProcessingLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('processing_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      const logs = data?.map(row => ({
        id: row.id,
        timestamp: new Date(row.timestamp),
        message: row.message,
        type: row.type as 'info' | 'success' | 'error' | 'warning',
        invoiceId: row.invoice_id || undefined
      })) || [];
      
      dispatch({ type: 'SET_PROCESSING_LOGS', payload: logs });
    } catch (error) {
      console.error('Error loading processing logs:', error);
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};