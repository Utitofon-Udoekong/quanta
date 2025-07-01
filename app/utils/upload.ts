import { supabase } from '@/app/utils/supabase/client';

/**
 * Uploads a file to Supabase storage using server-side API
 * @param bucketName The name of the storage bucket
 * @param fileName The name to give the file in storage
 * @param file The file to upload
 * @param onProgress Callback for upload progress
 * @returns Promise that resolves with the public URL of the uploaded file
 */
export async function uploadFileResumable(
  bucketName: string,
  fileName: string,
  file: File,
  onProgress?: (percentage: number) => void
): Promise<string> {
  try {
    // Create FormData for the upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucketName', bucketName);
    formData.append('fileName', fileName);

    // Simulate progress for better UX
    if (onProgress) {
      onProgress(5); // Starting
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    if (onProgress) {
      onProgress(100); // Complete
    }

    const { url } = await response.json();
    
    if (!url) {
      throw new Error('No URL returned from upload');
    }

    return url;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
} 