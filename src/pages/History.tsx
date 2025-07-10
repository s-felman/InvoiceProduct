import React, { useState } from 'react';
import { Search, Filter, Download, Eye, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import InvoiceDetails from '../components/InvoiceDetails';
import { clsx } from 'clsx';
import { format } from 'date-fns';

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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Invoice History</h1>
        <p className="mt-2 text-gray-600">
          View and manage all processed invoices
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
                placeholder="Search invoices..."
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
              <p className="text-gray-500">No invoices found matching your criteria.</p>
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">{invoice.fileName}</h3>
                      <span className={clsx(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        getStatusBadge(invoice.status)
                      )}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Uploaded: {format(invoice.uploadDate, 'MMM d, yyyy')}</span>
                      {invoice.extractedFields.vendor && (
                        <span>Vendor: {invoice.extractedFields.vendor}</span>
                      )}
                      {invoice.extractedFields.totalAmount && (
                        <span>Amount: ${invoice.extractedFields.totalAmount}</span>
                      )}
                      {invoice.status === 'completed' && (
                        <span>Confidence: {invoice.confidence.overall}%</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedInvoice(
                        selectedInvoice === invoice.id ? null : invoice.id
                      )}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
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
              <h2 className="text-lg font-semibold">Invoice Details</h2>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:text-gray-600"
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