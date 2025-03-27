import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/app/lib/utils';

export interface FileUploadProps {
  onUploadComplete: (key: string) => void;
  prefix: string;
  accept?: Record<string, string[]>;
  maxSize?: number;
  className?: string;
}

export function FileUpload({
  onUploadComplete,
  prefix,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    'video/*': ['.mp4', '.webm', '.ogg'],
    'audio/*': ['.mp3', '.wav', '.ogg'],
    'application/pdf': ['.pdf'],
    'text/markdown': ['.md'],
    'text/plain': ['.txt'],
    'application/zip': ['.zip'],
    'application/x-zip-compressed': ['.zip'],
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  className,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prefix', prefix);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload file');
      }

      onUploadComplete(data.data.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [prefix, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        '!border-2 !border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
        {
          '!border-gray-300 hover:border-gray-400': !isDragActive,
          '!border-blue-500 bg-blue-50': isDragActive,
        },
        className
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2" />
          <p className="text-sm text-gray-600">Uploading...</p>
        </div>
      ) : error ? (
        <div className="text-red-500 text-sm">{error}</div>
      ) : (
        <div>
          <p className="text-sm text-gray-600">
            {isDragActive
              ? 'Drop the file here'
              : 'Drag and drop a file here, or click to select'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Max file size: {Math.round(maxSize / (1024 * 1024))}MB
          </p>
        </div>
      )}
    </div>
  );
} 