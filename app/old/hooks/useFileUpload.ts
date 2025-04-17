import { useState } from 'react';

interface UploadResponse {
  url: string;
  key: string;
}

interface UseFileUploadReturn {
  uploadFile: (file: File, contentType: string) => Promise<UploadResponse>;
  deleteFile: (key: string) => Promise<void>;
  isUploading: boolean;
  error: string | null;
}

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File, contentType: string): Promise<UploadResponse> => {
    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('contentType', contentType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload file');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (key: string): Promise<void> => {
    try {
      setError(null);

      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete file');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    uploadFile,
    deleteFile,
    isUploading,
    error,
  };
} 