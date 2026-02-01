/**
 * Storage service for file uploads
 * Supports both local file storage (dev) and Cloudflare R2 (production)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'event-documents');

// Cloudflare R2 configuration (for production)
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'homeschool-events';

// Ensure upload directory exists (for local storage)
if (!IS_PRODUCTION) {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`📁 Created upload directory: ${UPLOAD_DIR}`);
  }
}

export interface UploadedFile {
  filename: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  storageType: 'local' | 'r2';
}

/**
 * Generate a unique filename to prevent collisions
 */
function generateUniqueFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${randomStr}${ext}`;
}

/**
 * Upload file to local storage (development)
 */
async function uploadToLocal(file: File): Promise<UploadedFile> {
  const filename = generateUniqueFilename(file.name);
  const filepath = path.join(UPLOAD_DIR, filename);

  // Save file to disk
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filepath, buffer);

  return {
    filename,
    originalFilename: file.name,
    fileSize: file.size,
    mimeType: file.type,
    storagePath: filepath,
    storageType: 'local'
  };
}

/**
 * Upload file to Cloudflare R2 (production)
 */
async function uploadToR2(file: File): Promise<UploadedFile> {
  const filename = generateUniqueFilename(file.name);

  // TODO: Implement R2 upload using AWS S3-compatible API
  // For now, this is a placeholder that will be implemented when deploying to production
  // You would use @aws-sdk/client-s3 to upload to R2

  throw new Error('R2 upload not yet implemented. Set NODE_ENV to development for local storage.');

  // Example R2 upload (uncomment when ready to use):
  /*
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await s3Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: `event-documents/${filename}`,
    Body: buffer,
    ContentType: file.type,
  }));

  return {
    filename,
    originalFilename: file.name,
    fileSize: file.size,
    mimeType: file.type,
    storagePath: `event-documents/${filename}`,
    storageType: 'r2'
  };
  */
}

/**
 * Upload a file (automatically selects storage based on environment)
 */
export async function uploadFile(file: File): Promise<UploadedFile> {
  if (IS_PRODUCTION) {
    return uploadToR2(file);
  } else {
    return uploadToLocal(file);
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(storagePath: string, storageType: 'local' | 'r2'): Promise<void> {
  if (storageType === 'local') {
    if (fs.existsSync(storagePath)) {
      fs.unlinkSync(storagePath);
    }
  } else {
    // TODO: Implement R2 delete
    // Use S3Client DeleteObjectCommand
  }
}

/**
 * Get file stream for download (local storage only for now)
 */
export function getFileStream(storagePath: string): fs.ReadStream {
  return fs.createReadStream(storagePath);
}

/**
 * Check if file exists
 */
export function fileExists(storagePath: string, storageType: 'local' | 'r2'): boolean {
  if (storageType === 'local') {
    return fs.existsSync(storagePath);
  }
  // For R2, would need to check using headObject
  return false;
}
