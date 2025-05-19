import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

export class DocumentModel {
  bucketName: string = process.env.BUCKET_NAME!;
  constructor() {}

  async getUploadUrl(Key: string, options?: { metadata?: Record<string, string> }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key,
      Metadata: options?.metadata || {},
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

  async documentExists(Key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key,
      });

      await s3.send(command);
      return true;
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      return false;
    }
  }

  async save({
    data,
    Key,
  }: {
    data: any,
    Key: string,
  }) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key,
      Body: data,
    });

    return s3.send(command);
  }
}