import React, { useState } from 'react';
import { Search, Filter, Eye, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import InvoiceDetails from '../components/InvoiceDetails';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { FileDownload } from '../components/FileDownload';

const History: React.FC = () => {
  const { state } = useApp();
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');

  const filteredInvoices = state.invoices.filter(invoice => {
    const matchesSearch = invoice.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.extractedFields.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.extractedFields.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedInvoiceData = selectedInvoice ?
    state.invoices.find(inv => inv.id === selectedInvoice) : null;

  const getStatusBadge = (status: string) => {
    const configs = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    return configs[status as keyof typeof configs] || 'bg-gray-100 text-gray-800';
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      // TODO: Implement delete functionality
      console.log('Delete invoice:', invoiceId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Invoice History</h1>
        <p className="mt-2 text-gray-600">
          View and manage all processed invoices ({filteredInvoices.length} total)
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        {/* Search and Filter */}
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by filename, vendor, or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <div className="divide-y">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No invoices found matching your criteria.' 
                  : 'No invoices uploaded yet. Upload your first invoice to get started.'}
              </p>
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {invoice.fileName}
                      </h3>
                      <span className={clsx(
                        'px-2 py-1 text-xs font-medium rounded-full flex-shrink-0',
                        getStatusBadge(invoice.status)
                      )}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>Uploaded: {format(invoice.uploadDate, 'MMM d, yyyy HH:mm')}</span>
                      {invoice.extractedFields.vendor && (
                        <span>Vendor: <span className="font-medium">{invoice.extractedFields.vendor}</span></span>
                      )}
                      {invoice.extractedFields.invoiceNumber && (
                        <span>Invoice #: <span className="font-medium">{invoice.extractedFields.invoiceNumber}</span></span>
                      )}
                      {invoice.extractedFields.totalAmount && (
                        <span>Amount: <span className="font-medium">${invoice.extractedFields.totalAmount}</span></span>
                      )}
                      {invoice.status === 'completed' && invoice.confidence && (
                        <span>Confidence: <span className="font-medium">{invoice.confidence.overall}%</span></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {/* View Details Button */}
                    <button
                      onClick={() => setSelectedInvoice(
                        selectedInvoice === invoice.id ? null : invoice.id
                      )}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Download Button - INSERTED HERE */}
                    {/* {invoice.fileInfo ? (
                      <FileDownload 
                        fileInfo={invoice.fileInfo} 
                        className="flex-shrink-0"
                      />
                    ) : (
                      <div className="p-2 text-gray-300" title="File not available">
                        <span className="text-xs">No file</span>
                      </div>
                    )} */}

                    {/* Delete Button
                    <button
                      onClick={() => handleDeleteInvoice(invoice.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Invoice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button> */}
                  </div>
                </div>

                {/* Additional info for selected invoice */}
                {selectedInvoice === invoice.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {invoice.extractedFields.date && (
                        <div>
                          <span className="font-medium text-gray-700">Date:</span>
                          <span className="ml-2 text-gray-600">{invoice.extractedFields.date}</span>
                        </div>
                      )}
                      {invoice.extractedFields.currency && (
                        <div>
                          <span className="font-medium text-gray-700">Currency:</span>
                          <span className="ml-2 text-gray-600">{invoice.extractedFields.currency}</span>
                        </div>
                      )}
                      {invoice.extractedFields.lineItems && invoice.extractedFields.lineItems.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Line Items:</span>
                          <span className="ml-2 text-gray-600">{invoice.extractedFields.lineItems.length} items</span>
                        </div>
                      )}
                      {invoice.fileInfo && (
                        <div>
                          <span className="font-medium text-gray-700">File Size:</span>
                          <span className="ml-2 text-gray-600">
                            {(invoice.fileInfo.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      )}
                      {invoice.ocrText && (
                        <div>
                          <span className="font-medium text-gray-700">Text Length:</span>
                          <span className="ml-2 text-gray-600">{invoice.ocrText.length} characters</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoiceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold">Invoice Details</h2>
                {selectedInvoiceData.fileInfo && (
                  <FileDownload 
                    fileInfo={selectedInvoiceData.fileInfo}
                    className="ml-auto"
                  />
                )}
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <InvoiceDetails invoice={selectedInvoiceData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;