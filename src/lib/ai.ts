import { AISettings } from '../types';

export const enhanceInvoiceParsingWithAI = async (
  ocrText: string,
  settings: AISettings,
  isImageOnlyPDF: boolean = false
): Promise<any> => {
  console.log('🤖 AI Enhancement Starting:', {
    provider: settings.provider,
    hasOcrText: !!ocrText,
    ocrTextLength: ocrText?.length || 0,
    isImageOnlyPDF,
    hasGeminiKey: !!settings.geminiApiKey
  });

  if (settings.provider === 'none' || !ocrText) {
    console.log('❌ AI Enhancement skipped:', settings.provider === 'none' ? 'Provider is none' : 'No OCR text');
    return null;
  }
  
  // Enhanced prompt for image-only PDFs or poor OCR quality
  const basePrompt = `
You are an expert invoice parser. Extract the following information from this invoice text and return ONLY a valid JSON object with no additional text or formatting.

REQUIRED FIELDS (must extract these):
- invoiceNumber: string (invoice number/ID - look for patterns like "Invoice #123", "INV-456", etc.)
- date: string (invoice date in YYYY-MM-DD format if possible)
- vendor: string (company/vendor name - the business issuing the invoice)
- totalAmount: number (total amount as number, no currency symbols)
- lineItems: array of objects with:
  - description: string (product/service description)
  - quantity: number
  - unitPrice: number
  - total: number

OPTIONAL FIELDS:
- currency: string (currency code like "USD", "EUR", etc.)
- subtotal: number (if available)
- tax: number (tax amount if available)
- taxRate: string (tax percentage if available)
- dueDate: string (due date if available)
- customerInfo: object with name, address if available

${isImageOnlyPDF ? `
IMPORTANT: This appears to be an image-only PDF with potentially poor OCR quality. 
Please be extra careful to:
1. Look for invoice numbers in various formats (#123, INV-123, Invoice: 123)
2. Extract dates in any format (MM/DD/YYYY, DD-MM-YYYY, etc.)
3. Identify the vendor/company name (usually at the top)
4. Find the total amount (may be labeled as "Total", "Amount Due", "Balance")
5. Extract line items even if formatting is poor
` : ''}

Invoice Text:
${ocrText}

Return only the JSON object with all available data:`;
  
  try {
    if (settings.provider === 'gemini' && settings.geminiApiKey) {
      console.log('🔥 Calling Google Gemini API...');
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${settings.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert invoice parser. Extract the following information from this invoice text and return ONLY a valid JSON object with no additional text or formatting.

${basePrompt}

CRITICAL: Return ONLY the JSON object, no markdown, no explanations, no additional text.`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Gemini API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorData}`);
      }
      
      const data = await response.json();
      console.log('✅ Gemini API Response received:', {
        hasCandidates: !!data.candidates?.length,
        candidatesCount: data.candidates?.length || 0,
        hasContent: !!data.candidates?.[0]?.content
      });
      
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      if (!content) {
        console.error('❌ No content received from Gemini API:', data);
        throw new Error('No content received from Gemini API');
      }
      
      console.log('📝 Gemini raw response:', content.substring(0, 200) + '...');
      
      // Clean the response in case AI adds markdown formatting
      const cleanedContent = content.replace(/```json\s*|\s*```/g, '').trim();
      
      try {
        const parsedData = JSON.parse(cleanedContent);
        console.log('✅ Gemini response parsed successfully:', {
          hasInvoiceNumber: !!parsedData.invoiceNumber,
          hasVendor: !!parsedData.vendor,
          hasTotalAmount: !!parsedData.totalAmount,
          lineItemsCount: parsedData.lineItems?.length || 0
        });
        return validateAndCleanData(parsedData);
      } catch (parseError) {
        console.error('❌ Failed to parse Gemini response as JSON:', {
          error: parseError,
          content
        });
        return null;
      }
    }
    
    if (settings.provider === 'openai' && settings.openaiApiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Changed to cheaper model
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert invoice parser specialized in extracting structured data from poor quality OCR text. Always respond with valid JSON only, no explanations or additional text.' 
            },
            { role: 'user', content: basePrompt }
          ],
          max_tokens: 2000,
          temperature: 0.1 // Very low temperature for consistent results
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData}`);
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      
      // Clean the response in case AI adds markdown formatting
      const cleanedContent = content.replace(/```json\s*|\s*```/g, '').trim();
      
      try {
        const parsedData = JSON.parse(cleanedContent);
        return validateAndCleanData(parsedData);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', content);
        return null;
      }
    }
    
    if (settings.provider === 'azure' && settings.azureApiKey) {
      const response = await fetch(`${settings.azureEndpoint}/openai/deployments/${settings.azureDeploymentName}/chat/completions?api-version=2023-05-15`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': settings.azureApiKey
        },
        body: JSON.stringify({
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert invoice parser specialized in extracting structured data from poor quality OCR text. Always respond with valid JSON only, no explanations or additional text.' 
            },
            { role: 'user', content: basePrompt }
          ],
          max_tokens: 2000,
          temperature: 0.1
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText} - ${errorData}`);
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      
      const cleanedContent = content.replace(/```json\s*|\s*```/g, '').trim();
      
      try {
        const parsedData = JSON.parse(cleanedContent);
        return validateAndCleanData(parsedData);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', content);
        return null;
      }
    }
  } catch (error) {
    console.error('AI parsing error:', error);
    return null;
  }
  
  return null;
};

// Enhanced validation and cleaning
function validateAndCleanData(data: any) {
  const cleaned = {
    invoiceNumber: data.invoiceNumber || null,
    date: normalizeDate(data.date) || null,
    vendor: data.vendor?.trim() || null,
    totalAmount: parseFloat(data.totalAmount) || null,
    currency: data.currency || 'USD',
    lineItems: Array.isArray(data.lineItems) ? data.lineItems.map((item: any) => ({
      description: item.description?.trim() || '',
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.unitPrice) || 0,
      total: parseFloat(item.total) || 0
    })).filter((item: any) => item.description && item.total > 0) : [],
    subtotal: parseFloat(data.subtotal) || null,
    tax: parseFloat(data.tax) || null,
    taxRate: data.taxRate || null,
    dueDate: normalizeDate(data.dueDate) || null,
    customerInfo: data.customerInfo || null
  };
  
  return cleaned;
}

function normalizeDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Return as-is if parsing fails
  }
  
  return dateStr;
}