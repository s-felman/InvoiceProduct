import Tesseract from 'tesseract.js';

export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Convert PDF to image for OCR processing
        // In a real implementation, you'd use PDF.js to convert PDF pages to images
        // For now, we'll handle image files directly
        const blob = new Blob([uint8Array], { type: file.type });
        const imageUrl = URL.createObjectURL(blob);
        
        const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng', {
          logger: (m) => console.log(m)
        });
        
        URL.revokeObjectURL(imageUrl);
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const parseInvoiceData = (text: string) => {
  // Basic regex patterns for invoice data extraction
  const invoiceNumberPattern = /(?:invoice|inv|#)\s*(?:number|no|num)?\s*:?\s*([a-zA-Z0-9-]+)/i;
  const datePattern = /(?:date|dated)\s*:?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i;
  const vendorPattern = /(?:from|vendor|company)\s*:?\s*([^\n]+)/i;
  const totalPattern = /(?:total|amount|sum)\s*:?\s*\$?(\d+\.?\d*)/i;
  
  const invoiceNumber = text.match(invoiceNumberPattern)?.[1];
  const date = text.match(datePattern)?.[1];
  const vendor = text.match(vendorPattern)?.[1]?.trim();
  const totalAmount = text.match(totalPattern)?.[1];
  
  // Extract line items (simplified)
  const lineItems = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const itemMatch = line.match(/(.+?)\s+(\d+)\s+\$?(\d+\.?\d*)\s+\$?(\d+\.?\d*)/);
    if (itemMatch) {
      lineItems.push({
        description: itemMatch[1].trim(),
        quantity: parseInt(itemMatch[2]),
        price: parseFloat(itemMatch[3]),
        total: parseFloat(itemMatch[4])
      });
    }
  }
  
  return {
    invoiceNumber,
    date,
    vendor,
    totalAmount,
    lineItems
  };
};

export const calculateConfidence = (extractedFields: any, ocrText: string) => {
  let totalConfidence = 0;
  let fieldCount = 0;
  const fieldConfidences: any = {};
  
  // Simple confidence calculation based on field completeness
  Object.keys(extractedFields).forEach(key => {
    if (extractedFields[key]) {
      fieldCount++;
      const confidence = Math.random() * 20 + 80; // Mock confidence between 80-100%
      fieldConfidences[key] = Math.round(confidence);
      totalConfidence += confidence;
    }
  });
  
  return {
    overall: fieldCount > 0 ? Math.round(totalConfidence / fieldCount) : 0,
    fields: fieldConfidences
  };
};