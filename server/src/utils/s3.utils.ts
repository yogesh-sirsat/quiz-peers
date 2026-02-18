import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import "dotenv/config";

const getS3Client = (): S3Client | null => {
  const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;

  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error("❌ Missing R2 Configuration in .env file!");
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID as string,
      secretAccessKey: R2_SECRET_ACCESS_KEY as string,
    },
  });
};

let s3Client: S3Client | null = getS3Client();

/**
 * Uploads a file to Cloudflare R2
 * @param {Buffer} fileBuffer - The file content
 * @param {string} fileName - The name to save as
 * @param {string} contentType - Mime type
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export async function uploadToR2(fileBuffer: Buffer, fileName: string, contentType: string): Promise<string> {
  if (!s3Client) {
    // Try to re-initialize in case env vars were loaded late
    s3Client = getS3Client();
    if (!s3Client) {
      throw new Error("S3 Client not initialized. Check your R2 environment variables.");
    }
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("R2_BUCKET_NAME is not defined in environment variables.");
  }
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
  return publicUrl;
}
