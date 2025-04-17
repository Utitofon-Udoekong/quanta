import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/app/old/lib/utils';
import Image from 'next/image';

export interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  prefix: string;
  accept?: Record<string, string[]>;
  maxSize?: number;
  className?: string;
  value?: File | null;
}

export function FileUpload({
  onFileSelect,
  prefix,
  accept = {
    // 'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    'video/*': ['.mp4', '.webm', '.ogg'],
    'audio/*': ['.mp3', '.wav', '.ogg'],
    // 'application/pdf': ['.pdf'],
    // 'text/markdown': ['.md'],
    // 'text/plain': ['.txt'],
    // 'application/zip': ['.zip'],
    // 'application/x-zip-compressed': ['.zip'],
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  className,
  value,
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);
    onFileSelect(file);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  const renderPreview = () => {
    if (!value) return null;

    const fileType = value.type;
    // const isImage = fileType.startsWith('image/');
    const isVideo = fileType.startsWith('video/');
    const isAudio = fileType.startsWith('audio/');
    // const isText = fileType.startsWith('text/') || fileType === 'application/pdf';

    // if (isImage) {
    //   return (
    //     <div className="relative w-full h-48 rounded-lg overflow-hidden">
    //       <Image
    //         src={URL.createObjectURL(value)}
    //         alt="Preview"
    //         fill
    //         className="object-cover"
    //       />
    //     </div>
    //   );
    // }

    if (isVideo) {
      return (
        <video
          src={URL.createObjectURL(value)}
          controls
          className="w-full h-48 rounded-lg object-cover"
        />
      );
    }

    if (isAudio) {
      return (
        <audio
          src={URL.createObjectURL(value)}
          controls
          className="w-full"
        />
      );
    }

    // if (isText) {
    //   return (
    //     <div className="w-full h-48 rounded-lg bg-gray-100 p-4 overflow-auto">
    //       <pre className="text-sm text-gray-800 whitespace-pre-wrap">
    //         {value.name}
    //       </pre>
    //     </div>
    //   );
    // }

    return (
      <div className="w-full h-48 rounded-lg bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-800">{value.name}</p>
          <p className="text-xs text-gray-500">
            {(value.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
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
        {error ? (
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

      {value && (
        <div className="relative">
          {renderPreview()}
          <button
            type="button"
            onClick={() => onFileSelect(null)}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
} 