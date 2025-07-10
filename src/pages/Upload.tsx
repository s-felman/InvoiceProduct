import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import ProcessingStatus from '../components/ProcessingStatus';
import InvoiceDetails from '../components/InvoiceDetails';
import { useApp } from '../contexts/AppContext';
import { extractTextFromPDF, parseInvoiceData, calculateConfidence } from '../lib/ocr';
import { enhanceInvoiceParsingWithAI } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { InvoiceData } from '../types';

const Upload: React.FC = () => {
  const { state, dispatch } = useApp();
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    
    // Create initial invoice record
    const invoiceId = crypto.randomUUID();
    const initialInvoice: InvoiceData = {
      id: invoiceId,
      fileName: file.name,
      uploadDate: new Date(),
      status: 'processing',
      extractedFields: {},
      confidence: { overall: 0, fields: {} }
    };

    setCurrentInvoice(initialInvoice);
    dispatch({ type: 'ADD_INVOICE', payload: initialInvoice });

    // Add processing log
    const startLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      message: `Started processing ${file.name}`,
      type: 'info' as const,
      invoiceId
    };
    dispatch({ type: 'ADD_LOG', payload: startLog });

        // Add OCR start log
        const ocrStartLog = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          message: `Starting OCR extraction for ${file.name}`,
          type: 'info' as const,
          invoiceId
        };
        dispatch({ type: 'ADD_LOG', payload: ocrStartLog });

    try {
      // Save to database
      await supabase.from('invoices').insert({
        // Add OCR complete log
        const ocrCompleteLog = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          message: `OCR extraction completed. Extracted ${ocrText.length} characters`,
          type: 'success' as const,
          invoiceId
        };
        dispatch({ type: 'ADD_LOG', payload: ocrCompleteLog });
        
        id: invoiceId,
        file_name: file.name,
        upload_date: new Date().toISOString(),
        status: 'processing',
        extracted_fields: {},
        confidence: { overall: 0, fields: {} }
      });

      // Extract text using OCR
      const ocrText = await extractTextFromPDF(file);
            const aiStartLog = {
              id: crypto.randomUUID(),
              timestamp: new Date(),
              message: `Starting AI enhancement with ${state.aiSettings.provider}`,
              type: 'info' as const,
              invoiceId
            };
            dispatch({ type: 'ADD_LOG', payload: aiStartLog });
            
      
      // Parse basic invoice data
      const extractedFields = parseInvoiceData(ocrText);
              const aiSuccessLog = {
                id: crypto.randomUUID(),
                timestamp: new Date(),
                message: `AI enhancement completed successfully`,
                type: 'success' as const,
                invoiceId
              };
              dispatch({ type: 'ADD_LOG', payload: aiSuccessLog });
      
      // Calculate confidence
      const confidence = calculateConfidence(extractedFields, ocrText);
      
      // Try to enhance with AI if configured
      let enhancedFields = extractedFields;
      if (state.aiSettings.provider !== 'none') {
        try {
          const aiEnhanced = await enhanceInvoiceParsingWithAI(ocrText, state.aiSettings);
          if (aiEnhanced) {
            enhancedFields = { ...extractedFields, ...aiEnhanced };
          }
        } catch (error) {
          console.error('AI enhancement failed:', error);
          const errorLog = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            message: `AI enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'warning' as const,
            invoiceId
          };
          dispatch({ type: 'ADD_LOG', payload: errorLog });
        }
      }

      // Update invoice with results
      const completedInvoice: InvoiceData = {
        ...initialInvoice,
        status: 'completed',
        extractedFields: enhancedFields,
        confidence,
        ocrText
      };

      setCurrentInvoice(completedInvoice);
      dispatch({ type: 'UPDATE_INVOICE', payload: completedInvoice });

      // Update database
      await supabase.from('invoices').update({
        status: 'completed',
        extracted_fields: enhancedFields,
        confidence,
        ocr_text: ocrText,
        updated_at: new Date().toISOString()
      }).eq('id', invoiceId);

      // Add success log
      const successLog = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        message: `Successfully processed ${file.name}`,
        type: 'success' as const,
        invoiceId
      };
      dispatch({ type: 'ADD_LOG', payload: successLog });

      // Save log to database
      await supabase.from('processing_logs').insert({
        timestamp: new Date().toISOString(),
        message: successLog.message,
        type: successLog.type,
        invoice_id: invoiceId
      });

    } catch (error) {
      console.error('Processing failed:', error);
      
      const failedInvoice: InvoiceData = {
        ...initialInvoice,
        status: 'failed'
      };

      setCurrentInvoice(failedInvoice);
      dispatch({ type: 'UPDATE_INVOICE', payload: failedInvoice });

      // Update database
      await supabase.from('invoices').update({
        status: 'failed',
        updated_at: new Date().toISOString()
      }).eq('id', invoiceId);

      // Add error log
      const errorLog = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error' as const,
        invoiceId
      };
      dispatch({ type: 'ADD_LOG', payload: errorLog });

      // Save log to database
      await supabase.from('processing_logs').insert({
        timestamp: new Date().toISOString(),
        message: errorLog.message,
        type: errorLog.type,
        invoice_id: invoiceId
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewUpload = () => {
    setCurrentInvoice(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload Invoice</h1>
        <p className="mt-2 text-gray-600">
          Upload a PDF invoice to extract data using OCR and AI analysis
        </p>
      </div>

      {!currentInvoice ? (
        <FileUpload
          onFileSelect={handleFileSelect}
          isProcessing={isProcessing}
          className="mb-8"
        />
      ) : (
        <div className="space-y-6">
          <ProcessingStatus
            status={currentInvoice.status}
            fileName={currentInvoice.fileName}
          />
          
          {currentInvoice.status === 'completed' && (
            <InvoiceDetails invoice={currentInvoice} />
          )}
          
          <div className="flex justify-between">
            <button
              onClick={handleNewUpload}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              Upload Another Invoice
            </button>
            <button
              onClick={() => navigate('/history')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              View All Invoices
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;