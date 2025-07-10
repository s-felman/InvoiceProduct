import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// // Use local worker file
// pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  // Enhanced regex patterns for invoice data extraction
  const invoiceNumberPatterns = [
    /(?:invoice|inv|bill|receipt)\s*(?:number|no|num|#)\s*:?\s*([a-zA-Z0-9-]+)/i,
    /(?:^|\s)(?:inv|invoice)\s*[#:]?\s*([a-zA-Z0-9-]+)/i,
    /#\s*([a-zA-Z0-9-]+)/i
  ];
  
  const datePatterns = [
    /(?:date|dated|invoice\s+date)\s*:?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i,
    /(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/g,
    /(?:date)\s*:?\s*([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/i
  ];
  
  const vendorPatterns = [
    /(?:from|vendor|company|bill\s+to|sold\s+by)\s*:?\s*([^\n\r]+?)(?:\n|\r|$)/i,
    /^([A-Z][A-Za-z\s&.,'-]+(?:LLC|Inc|Corp|Ltd|Co\.)?)\s*$/m,
    /(?:^|\n)([A-Z][A-Za-z\s&.,'-]{10,}?)(?:\n|$)/m
  ];
  
  const totalPatterns = [
    /(?:total|amount\s+due|grand\s+total|final\s+total)\s*:?\s*\$?\s*(\d+[.,]?\d*)/i,
    /(?:total)\s*\$?\s*(\d+[.,]\d{2})/i,
    /\$\s*(\d+[.,]\d{2})\s*(?:total|due|amount)/i
  ];
  
  // Extract invoice number
  let invoiceNumber = '';
  for (const pattern of invoiceNumberPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      invoiceNumber = match[1].trim();
      break;
    }
  }
  
  // Extract date
  let date = '';
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      date = match[1].trim();
      break;
    }
  }
  
  // Extract vendor
  let vendor = '';
  for (const pattern of vendorPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidateVendor = match[1].trim();
      if (candidateVendor.length > 3 && candidateVendor.length < 100) {
        vendor = candidateVendor;
        break;
      }
    }
  }
  
  // Extract total amount
  let totalAmount = '';
  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      totalAmount = match[1].replace(',', '.');
      break;
    }
  }
  
  // Extract line items (enhanced)
  const lineItems = [];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Pattern for line items: description + quantity + price + total
    const itemPatterns = [
      /^(.+?)\s+(\d+)\s+\$?\s*(\d+[.,]\d{2})\s+\$?\s*(\d+[.,]\d{2})$/,
      /^(.+?)\s+(\d+)\s+(\d+[.,]\d{2})\s+(\d+[.,]\d{2})$/,
      /(.+?)\s+\$?\s*(\d+[.,]\d{2})\s*$/
    ];
    
    for (const pattern of itemPatterns) {
      const itemMatch = line.match(pattern);
      if (itemMatch) {
        if (itemMatch.length === 5) {
          // Full line item with quantity
          lineItems.push({
            description: itemMatch[1].trim(),
            quantity: parseInt(itemMatch[2]),
            price: parseFloat(itemMatch[3].replace(',', '.')),
            total: parseFloat(itemMatch[4].replace(',', '.'))
          });
        } else if (itemMatch.length === 3) {
          // Simple item with just description and price
          lineItems.push({
            description: itemMatch[1].trim(),
            quantity: 1,
            price: parseFloat(itemMatch[2].replace(',', '.')),
            total: parseFloat(itemMatch[2].replace(',', '.'))
          });
        }
        break;
      }
    }
  }
  
  return {
    invoiceNumber: invoiceNumber || undefined,
    date: date || undefined,
    vendor: vendor || undefined,
    totalAmount: totalAmount || undefined,
    lineItems: lineItems.length > 0 ? lineItems : undefined
  };
};

export const calculateConfidence = (extractedFields: any, ocrText: string) => {
  let totalConfidence = 0;
  let fieldCount = 0;
  const fieldConfidences: any = {};
  
  // Calculate confidence based on field completeness and text quality
  const textQuality = Math.min(100, Math.max(50, ocrText.length / 10)); // Base confidence on text length
  
  Object.keys(extractedFields).forEach(key => {
    if (extractedFields[key]) {
      fieldCount++;
      let confidence = textQuality;
      
      // Adjust confidence based on field type and content
      switch (key) {
        case 'invoiceNumber':
          confidence = extractedFields[key].match(/^[A-Z0-9-]+$/i) ? 
            Math.min(95, confidence + 10) : Math.max(70, confidence - 10);
          break;
        case 'date':
          confidence = extractedFields[key].match(/\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/) ? 
            Math.min(90, confidence + 5) : Math.max(60, confidence - 15);
          break;
        case 'vendor':
          confidence = extractedFields[key].length > 5 ? 
            Math.min(85, confidence) : Math.max(50, confidence - 20);
          break;
        case 'totalAmount':
          confidence = extractedFields[key].match(/^\d+\.?\d*$/) ? 
            Math.min(90, confidence + 5) : Math.max(65, confidence - 10);
          break;
        case 'lineItems':
          confidence = extractedFields[key].length > 0 ? 
            Math.min(80, confidence) : Math.max(40, confidence - 30);
          break;
      }
      
      fieldConfidences[key] = Math.round(confidence);
      totalConfidence += confidence;
    }
  });
  
  return {
    overall: fieldCount > 0 ? Math.round(totalConfidence / fieldCount) : 0,
    fields: fieldConfidences
  };
};