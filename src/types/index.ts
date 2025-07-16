export interface InvoiceData {
  id: string;
  fileName: string;
  uploadDate: Date;
  status: 'processing' | 'completed' | 'failed';
  extractedFields: {
    invoiceNumber?: string;
    date?: string;
    vendor?: string;
    totalAmount?: string;
    lineItems?: Array<{
      description: string;
      quantity: number;
      price: number;
      total: number;
    }>;
  };
  confidence: {
    overall: number;
    fields: {
      invoiceNumber?: number;
      date?: number;
      vendor?: number;
      totalAmount?: number;
      lineItems?: number;
    };
  };
  ocrText?: string;
}

export interface AISettings {
  provider: 'openai' | 'azure' | 'gemini' | 'none';
  openaiApiKey?: string;
  azureApiKey?: string;
  azureEndpoint?: string;
  azureDeploymentName?: string;
  geminiApiKey?: string;
}

export interface ProcessingLog {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  invoiceId?: string;
}