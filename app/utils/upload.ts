import { supabase } from '@/app/utils/supabase/client';
import { Upload } from 'tus-js-client';
import { cookieName } from './supabase';
import Cookies from 'js-cookie';

/**
 * Uploads a file to Supabase storage using TUS for resumable uploads
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
  const accessToken = Cookies.get(cookieName);

  // Get the project ID from the Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const projectId = supabaseUrl.split('//')[1].split('.')[0];

  return new Promise((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: `https://${projectId}.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        'x-upsert': 'true',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucketName,
        objectName: fileName,
        contentType: file.type,
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024, // 6MB chunks as required by Supabase
      onError: function (error) {
        console.error('Upload failed:', error);
        reject(error);
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        const percentage = ((bytesUploaded / bytesTotal) * 100);
        if (onProgress) {
          onProgress(percentage);
        }
      },
      onSuccess: function () {
        // Get the public URL for the uploaded file
        const { data } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);
        
        resolve(data.publicUrl);
      },
    });

    // Check for previous uploads to resume
    upload.findPreviousUploads().then(function (previousUploads) {
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      
      // Start the upload
      upload.start();
    });
  });
} 