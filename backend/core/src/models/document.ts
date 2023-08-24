import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

export class DocumentModel {
  bucketName: string = process.env.BUCKET_NAME!;
  constructor() {}

  async getUploadUrl(Key: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 60 * 60 });

    return url;
  }

  async getDownloadUrl(Key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 60 * 60 * 24 });
    return url;
  }
}