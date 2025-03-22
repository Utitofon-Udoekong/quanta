import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getCloudflareConfig } from './config';

export class R2Client {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    const config = getCloudflareConfig();
    this.bucketName = config.bucketName;
    
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async uploadFile(file: File | Blob, key: string): Promise<string> {
    try {
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: file,
          ContentType: file.type,
        },
      });

      await upload.done();
      return `https://${this.bucketName}.r2.cloudflarestorage.com/${key}`;
    } catch (error) {
      console.error('Error uploading file to R2:', error);
      throw new Error('Failed to upload file to R2');
    }
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = {
        Bucket: this.bucketName,
        Key: key,
      };

      const url = await this.client.getSignedUrl('getObject', command);
      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.client.deleteObject({
        Bucket: this.bucketName,
        Key: key,
      });
    } catch (error) {
      console.error('Error deleting file from R2:', error);
      throw new Error('Failed to delete file from R2');
    }
  }
} 