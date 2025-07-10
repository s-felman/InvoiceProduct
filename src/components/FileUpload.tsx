import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
  accept?: string;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  isProcessing = false,
  accept = '.pdf,.png,.jpg,.jpeg',
  className
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      setError('Please select a PDF or image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    onFileSelect(file);
  }, [onFileSelect]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      
      // Validate file type
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        setError('Please select a PDF or image file');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div className={clsx('w-full', className)}>
      <div
        className={clsx(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          isProcessing && 'opacity-50 pointer-events-none'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className={clsx(
            'mx-auto h-12 w-12 transition-colors',
            isDragOver ? 'text-blue-400' : 'text-gray-400'
          )} />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Drop your invoice here, or{' '}
                <span className="text-blue-600 hover:text-blue-500">browse</span>
              </span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept={accept}
                onChange={handleFileSelect}
                disabled={isProcessing}
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">
              PDF, PNG, JPG up to 10MB
            </p>
          </div>
        </div>
        
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm font-medium text-gray-900">Processing...</span>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;