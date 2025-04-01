import { supabase } from './supabase';

export async function uploadFile(
  file: File,
  path: string,
  options: {
    onProgress?: (progress: number) => void;
  } = {}
): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from('content')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        // onUploadProgress: (event) => {
        //   if (options.onProgress) {
        //     const progress = (event.loaded / event.total) * 100;
        //     options.onProgress(progress);
        //   }
        // },
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('content')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export async function deleteFile(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('content')
      .remove([path]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

export function getFileUrl(path: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from('content')
    .getPublicUrl(path);

  return publicUrl;
} 