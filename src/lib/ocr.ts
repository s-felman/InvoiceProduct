import Tesseract from 'tesseract.js';
import { supabase } from './supabase';

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    if (file.type === 'application/pdf') {
      // Use server-side extraction for PDFs
      console.log('Using server-side PDF extraction...');
      return await extractTextFromPDFServer(file);
    } else if (file.type.startsWith('image/')) {
      // Use client-side OCR for images
      console.log('Using client-side OCR for image...');
      return await extractTextFromImage(file);
    } else {
      throw new Error('Unsupported file type. Please upload a PDF or image file.');
    }
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Enhanced server-side extraction with comprehensive data
const extractTextFromPDFServer = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('pdf', file);

  console.log('Calling Supabase Edge Function for PDF processing...');

  try {
    const { data, error } = await supabase.functions.invoke('extract-pdf', {
      body: formData,
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Server extraction failed: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Server extraction failed');
    }

    console.log('Server extraction successful!');
    console.log('File saved to:', data.fileInfo?.storagePath);
    
    // Store metadata including file information
    (window as any).lastExtractionMetadata = {
      isImageOnlyPDF: data.isImageOnlyPDF,
      requiresAIEnhancement: data.requiresAIEnhancement,
      confidence: data.confidence,
      parsedData: data.parsedData,
      fileInfo: data.fileInfo // NEW: File storage information
    };
    
    return data.text;
  } catch (error) {
    console.error('Server extraction failed:', error);
    console.log('Falling back to client-side OCR...');
    return await extractTextFromImage(file);
  }
};

// Enhanced client-side OCR with better settings
const extractTextFromImage = async (file: File): Promise<string> => {
  const imageUrl = URL.createObjectURL(file);
  
  try {
    console.log('Starting enhanced Tesseract OCR...');
    const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
      tessjs_create_pdf: '1',
      tessjs_pdf_title: 'Invoice',
      preserve_interword_spaces: '1'
    });
    
    if (!text.trim()) {
      throw new Error('No text could be extracted from the image');
    }
    
    console.log('Tesseract OCR completed');
    
    // Mark as likely image-only for AI enhancement
    //@ts-ignore
    window.lastExtractionMetadata = {
      isImageOnlyPDF: true,
      requiresAIEnhancement: true,
      confidence: 60, // Lower confidence for image-only
      parsedData: null
    };
    
    return text.trim();
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
};

// Enhanced parsing function with server data integration
export const parseInvoiceData = (text: string, serverData?: any) => {
  // If we have high-quality server-parsed data, use that
  if (serverData && Object.values(serverData).filter(Boolean).length >= 3) {
    console.log('Using server-parsed data');
    return {
      invoiceNumber: serverData.invoiceNumber,
      date: serverData.date,
      vendor: serverData.vendor,
      totalAmount: serverData.totalAmount,
      lineItems: serverData.lineItems || [],
      currency: serverData.currency || 'USD',
      subtotal: serverData.subtotal,
      tax: serverData.tax,
      taxRate: serverData.taxRate
    };
  }

  // Fallback to basic regex parsing with enhanced patterns
  console.log('Using fallback regex parsing');
  
  const invoicePatterns = [
    /(?:invoice|inv)\s*(?:number|no|num|#)?\s*:?\s*([a-zA-Z0-9-]+)/i,
    /(?:inv|invoice)\s*([a-zA-Z0-9-]+)/i,
    /#\s*([a-zA-Z0-9-]+)/,
    /(?:ref|reference)\s*:?\s*([a-zA-Z0-9-]+)/i
  ];
  
  const datePatterns = [
    /(?:date|dated|invoice\s+date)\s*:?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i,
    /(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/,
    /(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/
  ];
  
  const vendorPatterns = [
    /(?:from|vendor|company|bill\s+to)\s*:?\s*([^\n]+)/i,
    /^([A-Z][A-Za-z\s&,.-]+(?:Inc|LLC|Corp|Ltd|Co))/m
  ];
  
  const totalPatterns = [
    /(?:total|amount|sum|grand\s+total|balance\s+due)\s*:?\s*\$?(\d+[.,]?\d*)/i,
    /\$\s*(\d+[.,]\d{2})\s*$/m
  ];
  
  const invoiceNumber = findBestMatch(text, invoicePatterns);
  const date = findBestMatch(text, datePatterns);
  const vendor = findBestMatch(text, vendorPatterns);
  const totalAmount = findBestMatch(text, totalPatterns);
  
  // Extract line items
  const lineItems = extractBasicLineItems(text);
  
  return {
    invoiceNumber,
    date,
    vendor: vendor?.trim(),
    totalAmount,
    lineItems,
    currency: 'USD',
    subtotal: null,
    tax: null,
    taxRate: null
  };
};

function findBestMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractBasicLineItems(text: string): any[] {
  const lines = text.split('\n');
  const items = [];
  
  for (const line of lines) {
    const itemMatch = line.match(/(.+?)\s+(\d+)\s+\$?(\d+\.?\d*)\s+\$?(\d+\.?\d*)/);
    if (itemMatch) {
      items.push({
        description: itemMatch[1].trim(),
        quantity: parseInt(itemMatch[2]),
        unitPrice: parseFloat(itemMatch[3]),
        total: parseFloat(itemMatch[4])
      });
    }
  }
  
  return items;
}

export const calculateConfidence = (extractedFields: any, ocrText: string, serverConfidence?: number) => {
  // Use server confidence if available and reliable
  if (serverConfidence && serverConfidence > 70) {
    return {
      overall: serverConfidence,
      fields: {
        invoiceNumber: extractedFields.invoiceNumber ? 90 : 0,
        date: extractedFields.date ? 90 : 0,
        vendor: extractedFields.vendor ? 90 : 0,
        totalAmount: extractedFields.totalAmount ? 90 : 0,
        lineItems: extractedFields.lineItems?.length > 0 ? 90 : 0
      }
    };
  }

  // Calculate confidence based on extracted fields
  let score = 0;
  const fieldConfidences: any = {};
  
  // Required fields scoring
  if (extractedFields.invoiceNumber) {
    score += 25;
    fieldConfidences.invoiceNumber = 85;
  }
  if (extractedFields.date) {
    score += 20;
    fieldConfidences.date = 80;
  }
  if (extractedFields.vendor) {
    score += 20;
    fieldConfidences.vendor = 75;
  }
  if (extractedFields.totalAmount) {
    score += 20;
    fieldConfidences.totalAmount = 85;
  }
  if (extractedFields.lineItems?.length > 0) {
    score += 15;
    fieldConfidences.lineItems = 70;
  }
  
  return {
    overall: Math.min(score, 95),
    fields: fieldConfidences
  };
};

// Export metadata access
export const getLastExtractionMetadata = () => {
  return (window as any).lastExtractionMetadata || {};
};