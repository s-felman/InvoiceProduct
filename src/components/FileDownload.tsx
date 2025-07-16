import React from 'react';
import { Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FileDownloadProps {
  fileInfo?: {
    originalName: string;
    storagePath: string;
    publicUrl: string;
    size: number;
  };
  className?: string;
}

export const FileDownload: React.FC<FileDownloadProps> = ({ fileInfo, className = '' }) => {
  if (!fileInfo) return null;

  const handleDownload = async () => {
    try {
      // Option 1: Direct download from public URL
      const link = document.createElement('a');
      link.href = fileInfo.publicUrl;
      link.download = fileInfo.originalName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Option 2: If you need signed URLs for private files:
      // const { data, error } = await supabase.storage
      //   .from('invoice-files')
      //   .createSignedUrl(fileInfo.storagePath, 3600); // 1 hour expiry
      // 
      // if (data?.signedUrl) {
      //   window.open(data.signedUrl, '_blank');
      // }

    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        title={`Download ${fileInfo.originalName}`}
      >
        <Download size={16} />
        <span className="text-sm">Download Original</span>
      </button>
      <span className="text-xs text-gray-500">
        {formatFileSize(fileInfo.size)}
      </span>
    </div>
  );
};