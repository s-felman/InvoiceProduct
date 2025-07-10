//@ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('pdf') as File

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No PDF file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      )
    }

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`)

    // Initialize Supabase client for file storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileExtension = file.name.split('.').pop() || 'pdf'
    const uniqueFileName = `${timestamp}-${crypto.randomUUID()}.${fileExtension}`
    const filePath = `invoices/${uniqueFileName}`

    // Convert File to ArrayBuffer for storage
    const fileBuffer = await file.arrayBuffer()
    const fileBlob = new Uint8Array(fileBuffer)

    console.log(`Saving file to storage: ${filePath}`)

    // Save file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoice-files')
      .upload(filePath, fileBlob, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      throw new Error(`Failed to save file: ${uploadError.message}`)
    }

    console.log('File saved successfully:', uploadData.path)

    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from('invoice-files')
      .getPublicUrl(filePath)

    // Use OCR.space API for reliable PDF processing
    const ocrFormData = new FormData()
    ocrFormData.append('file', file)
    ocrFormData.append('apikey', 'helloworld') // Free tier API key
    ocrFormData.append('language', 'eng')
    ocrFormData.append('filetype', 'PDF')
    ocrFormData.append('detectOrientation', 'true')
    ocrFormData.append('isTable', 'true')
    ocrFormData.append('scale', 'true')
    ocrFormData.append('OCREngine', '2')
    
    console.log('Calling OCR.space API...')
    
    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: ocrFormData
    })
    
    if (!ocrResponse.ok) {
      throw new Error(`OCR API failed: ${ocrResponse.status} ${ocrResponse.statusText}`)
    }
    
    const ocrResult = await ocrResponse.json()
    console.log('OCR Response received:', ocrResult.IsErroredOnProcessing ? 'ERROR' : 'SUCCESS')
    
    if (ocrResult.IsErroredOnProcessing) {
      throw new Error(ocrResult.ErrorMessage || 'OCR processing failed')
    }
    
    const extractedText = ocrResult.ParsedResults?.[0]?.ParsedText || ''
    
    if (!extractedText.trim()) {
      throw new Error('No text could be extracted from the PDF')
    }

    console.log(`Extracted ${extractedText.length} characters`)

    // Enhanced parsing for all required fields
    const invoiceData = parseInvoiceDataFixed(extractedText)
    const confidence = calculateConfidenceFixed(invoiceData, extractedText)
    
    console.log('=== PARSING RESULTS ===')
    console.log('Invoice Number found:', invoiceData.invoiceNumber)
    console.log('Date found:', invoiceData.date)
    console.log('Vendor found:', invoiceData.vendor)
    console.log('Total found:', invoiceData.totalAmount)
    console.log('Line items found:', invoiceData.lineItems?.length || 0)
    console.log('=====================')

    // Determine if this is likely an image-only PDF
    const isImageOnlyPDF = extractedText.length < 200 || confidence < 70

    return new Response(
      JSON.stringify({ 
        text: extractedText,
        parsedData: invoiceData,
        success: true,
        confidence: confidence,
        isImageOnlyPDF: isImageOnlyPDF,
        requiresAIEnhancement: isImageOnlyPDF || Object.values(invoiceData).filter(Boolean).length < 3,
        processingTime: ocrResult.ProcessingTimeInMilliseconds,
        // File storage information
        fileInfo: {
          originalName: file.name,
          storedName: uniqueFileName,
          storagePath: filePath,
          publicUrl: urlData.publicUrl,
          size: file.size,
          contentType: file.type
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )

  } catch (error) {
    console.error('PDF processing error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process PDF',
        details: error.message,
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
  }
})

// COMPLETELY REWRITTEN PARSING FUNCTION
function parseInvoiceDataFixed(text: string) {
  console.log('=== STARTING ENHANCED PARSING ===')
  
  // Clean the text first
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()

  console.log('Cleaned text sample:', cleanText.substring(0, 300))

  // ENHANCED INVOICE NUMBER PATTERNS - More comprehensive
  const invoicePatterns = [
    // Direct patterns with labels
    /(?:invoice\s*(?:number|no|num|#)?)\s*:?\s*([A-Za-z0-9\-_\.]+)/gi,
    /(?:inv\s*(?:number|no|num|#)?)\s*:?\s*([A-Za-z0-9\-_\.]+)/gi,
    /(?:bill\s*(?:number|no|num|#)?)\s*:?\s*([A-Za-z0-9\-_\.]+)/gi,
    /(?:reference\s*(?:number|no|num|#)?)\s*:?\s*([A-Za-z0-9\-_\.]+)/gi,
    /(?:document\s*(?:number|no|num|#)?)\s*:?\s*([A-Za-z0-9\-_\.]+)/gi,
    
    // Hash patterns
    /#\s*([A-Za-z0-9\-_\.]{3,20})/g,
    
    // Standalone patterns
    /\b(?:INV|INVOICE)\s*([A-Za-z0-9\-_\.]{3,20})/gi,
    /\b([A-Z]{2,4}\-?\d{3,10})\b/g,
    /\b(\d{4,10}[A-Z]*)\b/g,
    
    // Line start patterns
    /^([A-Z0-9\-_\.]{5,20})\s/gm
  ]

  // ENHANCED DATE PATTERNS
  const datePatterns = [
    // With labels
    /(?:date|dated|invoice\s*date|bill\s*date|created)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
    /(?:date|dated|invoice\s*date|bill\s*date|created)\s*:?\s*(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/gi,
    
    // Standalone dates
    /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b/g,
    /\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/g,
    
    // Written dates
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/gi,
    /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/gi
  ]

  // ENHANCED VENDOR PATTERNS
  const vendorPatterns = [
    // With clear labels
    /(?:from|vendor|company|supplier|billed?\s*by|invoice[dr]?\s*by)\s*:?\s*([^\n\r]{3,80})/gi,
    /(?:sold\s*by|issued\s*by|bill\s*to)\s*:?\s*([^\n\r]{3,80})/gi,
    
    // Company name patterns
    /\b([A-Z][A-Za-z\s&,.\-']{5,60}(?:Inc|LLC|Corp|Ltd|Co|Company|Corporation|Limited)\.?)\b/g,
    
    // First line patterns (often vendor name)
    /^([A-Z][A-Za-z\s&,.\-']{5,60})\s*$/gm,
    
    // Address patterns
    /([A-Z][A-Za-z\s&,.\-']{10,})\s+\d+\s+[A-Za-z\s]+/g
  ]

  // ENHANCED TOTAL PATTERNS
  const totalPatterns = [
    // With clear labels
    /(?:total|amount\s*due|grand\s*total|balance\s*due|final\s*amount|total\s*amount)\s*:?\s*[$€£¥¢]?\s*(\d+[,.]?\d*\.?\d*)/gi,
    
    // Currency first
    /[$€£¥¢]\s*(\d+[,.]\d{2})\b/g,
    
    // End of line amounts (likely totals)
    /(\d+[,.]\d{2})\s*$/gm,
    
    // Large standalone amounts
    /\b(\d{2,6}[,.]\d{2})\b/g
  ]

  // Extract all candidates
  const invoiceNumbers = extractCandidates(cleanText, invoicePatterns, 'invoice')
  const dates = extractCandidates(cleanText, datePatterns, 'date')
  const vendors = extractCandidates(cleanText, vendorPatterns, 'vendor')
  const totals = extractCandidates(cleanText, totalPatterns, 'total')

  // Select best candidates
  const bestInvoiceNumber = selectBestInvoiceNumber(invoiceNumbers)
  const bestDate = selectBestDate(dates)
  const bestVendor = selectBestVendor(vendors)
  const bestTotal = selectBestTotal(totals)

  // Extract line items
  const lineItems = extractLineItemsFixed(cleanText)

  const result = {
    invoiceNumber: bestInvoiceNumber,
    date: bestDate,
    vendor: bestVendor,
    totalAmount: bestTotal,
    lineItems: lineItems,
    currency: detectCurrency(text),
    subtotal: extractSubtotal(cleanText),
    tax: extractTax(cleanText),
    taxRate: extractTaxRate(cleanText)
  }

  console.log('=== FINAL PARSING RESULTS ===')
  console.log('Invoice Number:', result.invoiceNumber)
  console.log('Date:', result.date)
  console.log('Vendor:', result.vendor)
  console.log('Total Amount:', result.totalAmount)
  console.log('Line Items:', result.lineItems?.length || 0)
  console.log('=============================')

  return result
}

function extractCandidates(text: string, patterns: RegExp[], type: string): any[] {
  const candidates = []
  
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const value = match[1]?.trim()
      if (value && value.length > 0) {
        candidates.push({
          value: value,
          fullMatch: match[0],
          index: match.index,
          type: type
        })
      }
    }
  }
  
  console.log(`Found ${candidates.length} ${type} candidates:`, candidates.slice(0, 5))
  return candidates
}

function selectBestInvoiceNumber(candidates: any[]): string | null {
  if (candidates.length === 0) return null
  
  // Score each candidate
  const scored = candidates.map(candidate => ({
    ...candidate,
    score: scoreInvoiceNumber(candidate)
  }))
  
  // Sort by score
  scored.sort((a, b) => b.score - a.score)
  
  console.log('Top invoice number candidates:', scored.slice(0, 3))
  
  return scored[0]?.score > 0 ? scored[0].value : null
}

function scoreInvoiceNumber(candidate: any): number {
  let score = 0
  const value = candidate.value.toUpperCase()
  const fullMatch = candidate.fullMatch.toLowerCase()
  
  // Length scoring
  if (value.length >= 3 && value.length <= 20) score += 10
  if (value.length >= 5 && value.length <= 12) score += 5
  
  // Pattern scoring
  if (/^[A-Z]{2,4}\-?\d{3,}$/.test(value)) score += 20 // INV-123 format
  if (/^\d{4,}[A-Z]*$/.test(value)) score += 15 // 123456A format
  if (/^[A-Z]+\d+$/.test(value)) score += 15 // INV123 format
  
  // Context scoring
  if (fullMatch.includes('invoice')) score += 25
  if (fullMatch.includes('inv')) score += 20
  if (fullMatch.includes('reference')) score += 15
  if (fullMatch.includes('bill')) score += 10
  if (fullMatch.includes('#')) score += 10
  
  // Penalty for common words
  if (/^(TOTAL|DATE|AMOUNT|USD|EUR|TAX)$/.test(value)) score -= 50
  if (/^(THE|AND|FOR|WITH)$/.test(value)) score -= 30
  
  return score
}

function selectBestDate(candidates: any[]): string | null {
  if (candidates.length === 0) return null
  
  const validDates = candidates
    .map(candidate => ({
      ...candidate,
      parsed: parseDate(candidate.value),
      score: scoreDateCandidate(candidate)
    }))
    .filter(candidate => candidate.parsed)
    .sort((a, b) => b.score - a.score)
  
  console.log('Top date candidates:', validDates.slice(0, 3))
  
  return validDates[0]?.parsed || null
}

function parseDate(dateStr: string): string | null {
  try {
    // Try different parsing approaches
    let date = new Date(dateStr)
    
    // If direct parsing fails, try manual formats
    if (isNaN(date.getTime())) {
      // Try MM/DD/YYYY or DD/MM/YYYY
      const parts = dateStr.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/)
      if (parts) {
        const year = parts[3].length === 2 ? '20' + parts[3] : parts[3]
        // Assume MM/DD/YYYY format first
        date = new Date(parseInt(year), parseInt(parts[1]) - 1, parseInt(parts[2]))
        
        // If that's invalid, try DD/MM/YYYY
        if (isNaN(date.getTime())) {
          date = new Date(parseInt(year), parseInt(parts[2]) - 1, parseInt(parts[1]))
        }
      }
    }
    
    // Validate date range
    if (!isNaN(date.getTime()) && 
        date.getFullYear() >= 2000 && 
        date.getFullYear() <= 2030) {
      return date.toISOString().split('T')[0]
    }
  } catch (e) {
    console.log('Date parsing failed for:', dateStr)
  }
  
  return null
}

function scoreDateCandidate(candidate: any): number {
  let score = 0
  const fullMatch = candidate.fullMatch.toLowerCase()
  
  // Context scoring
  if (fullMatch.includes('date')) score += 20
  if (fullMatch.includes('invoice')) score += 15
  if (fullMatch.includes('bill')) score += 10
  
  // Format scoring
  if (/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}/.test(candidate.value)) score += 15
  if (/\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/.test(candidate.value)) score += 10
  
  return score
}

function selectBestVendor(candidates: any[]): string | null {
  if (candidates.length === 0) return null
  
  const scored = candidates
    .map(candidate => ({
      ...candidate,
      score: scoreVendor(candidate)
    }))
    .sort((a, b) => b.score - a.score)
  
  console.log('Top vendor candidates:', scored.slice(0, 3))
  
  return scored[0]?.score > 0 ? scored[0].value.trim() : null
}

function scoreVendor(candidate: any): number {
  let score = 0
  const value = candidate.value
  const fullMatch = candidate.fullMatch.toLowerCase()
  
  // Length scoring
  if (value.length >= 5 && value.length <= 80) score += 10
  if (value.length >= 10 && value.length <= 50) score += 5
  
  // Company indicators
  if (/(?:Inc|LLC|Corp|Ltd|Co|Company|Corporation|Limited)\.?$/i.test(value)) score += 20
  
  // Context scoring
  if (fullMatch.includes('from')) score += 15
  if (fullMatch.includes('vendor')) score += 20
  if (fullMatch.includes('company')) score += 15
  if (fullMatch.includes('billed by')) score += 20
  
  // Capitalization
  if (/^[A-Z]/.test(value)) score += 5
  
  // Penalty for common non-vendor words
  if (/^(invoice|total|date|amount|description|quantity|price)/i.test(value)) score -= 30
  
  return score
}

function selectBestTotal(candidates: any[]): number | null {
  if (candidates.length === 0) return null
  
  const scored = candidates
    .map(candidate => ({
      ...candidate,
      numericValue: parseFloat(candidate.value.replace(/[,\s]/g, '')),
      score: scoreTotalAmount(candidate)
    }))
    .filter(candidate => !isNaN(candidate.numericValue) && candidate.numericValue > 0)
    .sort((a, b) => b.score - a.score)
  
  console.log('Top total candidates:', scored.slice(0, 5))
  
  return scored[0]?.numericValue || null
}

function scoreTotalAmount(candidate: any): number {
  let score = 0
  const value = candidate.value
  const fullMatch = candidate.fullMatch.toLowerCase()
  const numericValue = parseFloat(value.replace(/[,\s]/g, ''))
  
  // Context scoring
  if (fullMatch.includes('total')) score += 25
  if (fullMatch.includes('amount due')) score += 30
  if (fullMatch.includes('grand total')) score += 30
  if (fullMatch.includes('balance')) score += 20
  
  // Currency symbol presence
  if (/[$€£¥¢]/.test(fullMatch)) score += 15
  
  // Amount range scoring
  if (numericValue >= 10 && numericValue <= 100000) score += 10
  if (numericValue >= 50 && numericValue <= 10000) score += 5
  
  // Decimal places
  if (/\.\d{2}$/.test(value)) score += 10
  
  // Position scoring (totals often at end)
  if (candidate.index > fullMatch.length * 0.7) score += 5
  
  return score
}

function extractLineItemsFixed(text: string): any[] {
  const lines = text.split('\n')
  const items = []
  
  // Patterns for line items
  const patterns = [
    // description qty unit_price total
    /^(.{5,50})\s+(\d+)\s+[$€£¥¢]?\s*(\d+[.,]?\d*)\s+[$€£¥¢]?\s*(\d+[.,]?\d*)\s*$/,
    // qty description unit_price total  
    /^(\d+)\s+(.{5,50})\s+[$€£¥¢]?\s*(\d+[.,]?\d*)\s+[$€£¥¢]?\s*(\d+[.,]?\d*)\s*$/,
    // description total (assume qty=1)
    /^(.{10,50})\s+[$€£¥¢]?\s*(\d+[.,]?\d*)\s*$/
  ]
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length < 10) continue
    
    // Skip header lines
    if (/^(description|item|product|quantity|price|total|amount)/i.test(trimmed)) continue
    
    for (let i = 0; i < patterns.length; i++) {
      const match = trimmed.match(patterns[i])
      if (match) {
        let item
        
        if (i === 0) { // description qty price total
          item = {
            description: match[1].trim(),
            quantity: parseInt(match[2]),
            unitPrice: parseFloat(match[3].replace(',', '.')),
            total: parseFloat(match[4].replace(',', '.'))
          }
        } else if (i === 1) { // qty description price total
          item = {
            description: match[2].trim(),
            quantity: parseInt(match[1]),
            unitPrice: parseFloat(match[3].replace(',', '.')),
            total: parseFloat(match[4].replace(',', '.'))
          }
        } else if (i === 2) { // description total
          const total = parseFloat(match[2].replace(',', '.'))
          item = {
            description: match[1].trim(),
            quantity: 1,
            unitPrice: total,
            total: total
          }
        }
        
        // Validate item
        if (item && 
            item.description.length > 3 && 
            item.total > 0 && 
            item.quantity > 0 && 
            !isNaN(item.unitPrice)) {
          items.push(item)
          break
        }
      }
    }
  }
  
  console.log(`Extracted ${items.length} line items:`, items)
  return items
}

// Helper functions
function detectCurrency(text: string): string {
  if (text.includes('€') || /EUR/i.test(text)) return 'EUR'
  if (text.includes('£') || /GBP/i.test(text)) return 'GBP'
  if (text.includes('¥') || /JPY/i.test(text)) return 'JPY'
  if (text.includes('$') || /USD/i.test(text)) return 'USD'
  return 'USD'
}

function extractSubtotal(text: string): number | null {
  const match = text.match(/(?:subtotal|sub\s*total)\s*:?\s*[$€£¥¢]?\s*(\d+[.,]?\d*)/gi)
  return match ? parseFloat(match[0].replace(/[^0-9.,]/g, '').replace(',', '.')) : null
}

function extractTax(text: string): number | null {
  const match = text.match(/(?:tax|vat|sales\s*tax)\s*:?\s*[$€£¥¢]?\s*(\d+[.,]?\d*)/gi)
  return match ? parseFloat(match[0].replace(/[^0-9.,]/g, '').replace(',', '.')) : null
}

function extractTaxRate(text: string): string | null {
  const match = text.match(/(?:tax|vat)\s*(?:rate)?\s*:?\s*(\d+[.,]?\d*%)/gi)
  return match ? match[0].replace(/.*?(\d+[.,]?\d*%).*/, '$1') : null
}

function calculateConfidenceFixed(extractedFields: any, ocrText: string): number {
  let score = 0
  
  // Core fields scoring
  if (extractedFields.invoiceNumber) score += 25
  if (extractedFields.date) score += 20
  if (extractedFields.vendor) score += 20
  if (extractedFields.totalAmount) score += 20
  if (extractedFields.lineItems && extractedFields.lineItems.length > 0) score += 15
  
  console.log(`Confidence calculation: Invoice(${extractedFields.invoiceNumber ? 25 : 0}) + Date(${extractedFields.date ? 20 : 0}) + Vendor(${extractedFields.vendor ? 20 : 0}) + Total(${extractedFields.totalAmount ? 20 : 0}) + LineItems(${extractedFields.lineItems?.length > 0 ? 15 : 0}) = ${score}`)
  
  return Math.min(score, 95)
}