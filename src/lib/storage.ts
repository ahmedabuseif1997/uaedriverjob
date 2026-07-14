import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("File storage is not configured on this deployment (DO_SPACES_* env vars are unset).");
    this.name = "StorageNotConfiguredError";
  }
}

function isConfigured(): boolean {
  return Boolean(
    process.env.DO_SPACES_ENDPOINT &&
      process.env.DO_SPACES_REGION &&
      process.env.DO_SPACES_BUCKET &&
      process.env.DO_SPACES_KEY &&
      process.env.DO_SPACES_SECRET
  );
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!isConfigured()) throw new StorageNotConfiguredError();
  if (!client) {
    client = new S3Client({
      endpoint: process.env.DO_SPACES_ENDPOINT,
      region: process.env.DO_SPACES_REGION,
      forcePathStyle: false,
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY!,
        secretAccessKey: process.env.DO_SPACES_SECRET!,
      },
    });
  }
  return client;
}

export type UploadKind = "driver-photo" | "driver-resume" | "company-logo";

/** Returns a presigned PUT URL the browser can upload directly to, plus the resulting public URL. */
export async function getPresignedUploadUrl(
  kind: UploadKind,
  userId: string,
  contentType: string,
  extension: string
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const s3 = getClient();
  const bucket = process.env.DO_SPACES_BUCKET!;
  const key = `${kind}/${userId}/${randomUUID()}${extension ? `.${extension}` : ""}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ACL: "public-read",
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const cdnBase = process.env.DO_SPACES_CDN_URL?.replace(/\/$/, "");
  const publicUrl = cdnBase
    ? `${cdnBase}/${key}`
    : `${process.env.DO_SPACES_ENDPOINT}/${bucket}/${key}`;

  return { uploadUrl, publicUrl, key };
}

export { isConfigured as isStorageConfigured };
