import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  accept: Record<string, string[]>;
  maxSize?: number;
  file: File | null;
  label: string;
  error?: string;
  currentFileUrl?: string;
  isEditing?: boolean;
}

export default function FileDropzone({
  onFileSelect,
  accept,
  maxSize = 100 * 1024 * 1024, // 100MB default
  file,
  label,
  error,
  currentFileUrl,
  isEditing = false
}: FileDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer
          ${isDragActive ? 'border-indigo-500 bg-indigo-50/5' : 'border-gray-700/50 hover:border-indigo-500/50'}
          ${error ? 'border-red-500' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <CloudArrowUpIcon className={`w-12 h-12 ${isDragActive ? 'text-indigo-500' : 'text-gray-400'}`} />
          <div className="text-sm">
            {file ? (
              <p className="text-indigo-400">Selected: {file.name}</p>
            ) : (
              <>
                <p className="text-gray-300">
                  {isDragActive ? 'Drop the file here' : `Drag & drop your ${label} here`}
                </p>
                <p className="text-gray-500 mt-1">or click to select</p>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {isEditing && !file && currentFileUrl && (
        <p className="text-sm text-gray-400">
          Current {label.toLowerCase()} will be kept if no new file is selected
        </p>
      )}
    </div>
  );
} 