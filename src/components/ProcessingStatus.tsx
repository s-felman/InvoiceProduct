import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface ProcessingStatusProps {
  status: 'processing' | 'completed' | 'failed';
  fileName?: string;
  className?: string;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ status, fileName, className }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'processing':
        return {
          icon: <Loader2 className="h-8 w-8 animate-spin text-blue-500" />,
          title: 'Processing Invoice',
          description: 'Extracting data using OCR and AI analysis...',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          title: 'Processing Complete',
          description: 'Successfully extracted invoice data',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700'
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-8 w-8 text-red-500" />,
          title: 'Processing Failed',
          description: 'Could not extract data from the invoice',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700'
        };
      default:
        return {
          icon: <Loader2 className="h-8 w-8 animate-spin text-gray-500" />,
          title: 'Processing',
          description: 'Please wait...',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={clsx('rounded-lg border p-6', config.bgColor, className)}>
      <div className="flex items-center space-x-4">
        {config.icon}
        <div>
          <h3 className={clsx('text-lg font-medium', config.textColor)}>
            {config.title}
          </h3>
          <p className={clsx('text-sm', config.textColor)}>
            {config.description}
          </p>
          {fileName && (
            <p className={clsx('text-xs mt-1', config.textColor)}>
              File: {fileName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus;