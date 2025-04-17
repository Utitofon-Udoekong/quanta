import { useState } from 'react';

interface UploadOptions {
  prefix?: string;
  onSuccess?: (data: UploadResult) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  key: string;
  contentType: string;
  size: number;
}

export function useUpload(options: UploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const upload = async (file: File): Promise<UploadResult | null> => {
    try {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      if (options.prefix) {
        formData.append('prefix', options.prefix);
      }

      const xhr = new XMLHttpRequest();

      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setProgress(progress);
          options.onProgress?.(progress);
        }
      };

      // Create a promise to handle the upload
      const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.data) {
              resolve(response.data);
            } else {
              reject(new Error(response.error || 'Upload failed'));
            }
          } else {
            reject(new Error(`HTTP Error: ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error occurred'));
        };
      });

      // Start the upload
      xhr.open('POST', '/api/upload');
      xhr.send(formData);

      const result = await uploadPromise;
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    upload,
    isUploading,
    error,
    progress,
  };
} 