import React from 'react';
import { InvoiceData } from '../types';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface InvoiceDetailsProps {
  invoice: InvoiceData;
  className?: string;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ invoice, className }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50';
    if (confidence >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className={clsx('bg-white rounded-lg shadow-sm border', className)}>
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{invoice.fileName}</h3>
            <p className="text-sm text-gray-500">
              Uploaded on {invoice.uploadDate.toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(invoice.status)}
            <span className="text-sm font-medium capitalize">{invoice.status}</span>
          </div>
        </div>
      </div>

      {invoice.status === 'completed' && (
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Extracted Fields</h4>
              <div className="space-y-3">
                {invoice.extractedFields.invoiceNumber && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Invoice Number:</span>
                    <span className="text-sm font-medium">{invoice.extractedFields.invoiceNumber}</span>
                  </div>
                )}
                {invoice.extractedFields.date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm font-medium">{invoice.extractedFields.date}</span>
                  </div>
                )}
                {invoice.extractedFields.vendor && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Vendor:</span>
                    <span className="text-sm font-medium">{invoice.extractedFields.vendor}</span>
                  </div>
                )}
                {invoice.extractedFields.totalAmount && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className="text-sm font-medium">${invoice.extractedFields.totalAmount}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Confidence Levels</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overall:</span>
                  <span className={clsx(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    getConfidenceColor(invoice.confidence.overall)
                  )}>
                    {invoice.confidence.overall}%
                  </span>
                </div>
                {Object.entries(invoice.confidence.fields).map(([field, confidence]) => (
                  <div key={field} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className={clsx(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      getConfidenceColor(confidence as number)
                    )}>
                      {confidence}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {invoice.extractedFields.lineItems && invoice.extractedFields.lineItems.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Line Items</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.extractedFields.lineItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-sm text-gray-900">{item.description}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">${item.price}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">${item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceDetails;