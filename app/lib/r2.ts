import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2_ENDPOINT = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || '',
  },
});

export const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET || '';

export async function uploadToR2(
  file: File | Buffer,
  key: string,
  contentType?: string
): Promise<string> {
  try {
    const upload = new Upload({
      client: r2Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
      },
    });

    await upload.done();
    return key;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw new Error('Failed to upload file');
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    console.error('Error deleting from R2:', error);
    throw new Error('Failed to delete file');
  }
}

export function generateR2PublicUrl(key: string): string {
  return `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`;
}

export function generateUniqueFileKey(
  originalFilename: string,
  prefix?: string
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const extension = sanitizedFilename.split('.').pop();
  
  return prefix
    ? `${prefix}/${timestamp}-${randomString}.${extension}`
    : `${timestamp}-${randomString}.${extension}`;
} 