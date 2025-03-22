import { R2Bucket } from '@cloudflare/workers-types';

declare global {
  var cloudflare: {
    env: {
      R2: R2Bucket;
    };
  };
}

export interface CloudflareEnv {
  R2: R2Bucket;
}

export const getCloudflareConfig = () => {
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID is not defined');
  }
  if (!process.env.CLOUDFLARE_ACCESS_KEY_ID) {
    throw new Error('CLOUDFLARE_ACCESS_KEY_ID is not defined');
  }
  if (!process.env.CLOUDFLARE_SECRET_ACCESS_KEY) {
    throw new Error('CLOUDFLARE_SECRET_ACCESS_KEY is not defined');
  }
  if (!process.env.CLOUDFLARE_R2_BUCKET) {
    throw new Error('CLOUDFLARE_R2_BUCKET is not defined');
  }

  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    bucketName: process.env.CLOUDFLARE_R2_BUCKET,
  };
}; 