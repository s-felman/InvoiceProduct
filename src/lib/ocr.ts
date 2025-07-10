import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Use local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    if (file.type === 'application/pdf') {
      return await extractTextFromPDFFile(file);
    } else if (file.type.startsWith('image/')) {
      return await extractTextFromImage(file);
    } else {
      throw new Error('Unsupported file type. Please upload a PDF or image file.');
    }
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const extractTextFromPDFFile = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  // Process each page
  for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 5); pageNum++) { // Limit to first 5 pages
    try {
      const page = await pdf.getPage(pageNum);
      
      // Get text content first (faster)
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();
      
      if (pageText && pageText.length > 50) {
        // If we have good text content, use it
        fullText += pageText + '\n';
      } else {
        // If text is sparse, use OCR on rendered page
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        // Convert canvas to blob and run OCR
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });
        
        const imageUrl = URL.createObjectURL(blob);
        const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress Page ${pageNum}: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        
        URL.revokeObjectURL(imageUrl);
        fullText += text + '\n';
      }
    } catch (pageError) {
      console.error(`Error processing page ${pageNum}:`, pageError);
      // Continue with other pages
    }
  }
  
  if (!fullText.trim()) {
    throw new Error('No text could be extracted from the PDF');
  }
  
  return fullText.trim();
};

const extractTextFromImage = async (file: File): Promise<string> => {
  const imageUrl = URL.createObjectURL(file);
  
  try {
    const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    if (!text.trim()) {
      throw new Error('No text could be extracted from the image');
    }
    
    return text.trim();
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
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