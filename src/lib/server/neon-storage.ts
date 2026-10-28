import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

let client: S3Client | undefined;

function getClient(): S3Client {
  if (client) return client;

  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION;
  if (!endpoint || !accessKeyId || !secretAccessKey || !region) {
    throw new Error("Konfigurasi Neon Object Storage belum lengkap.");
  }

  let parsedEndpoint: URL;
  try {
    parsedEndpoint = new URL(endpoint);
  } catch {
    throw new Error("AWS_ENDPOINT_URL_S3 bukan URL yang valid.");
  }
  if (
    parsedEndpoint.protocol !== "https:" ||
    !parsedEndpoint.hostname.endsWith(".aws.neon.tech") ||
    parsedEndpoint.username ||
    parsedEndpoint.password ||
    parsedEndpoint.search ||
    parsedEndpoint.hash ||
    (parsedEndpoint.pathname !== "" && parsedEndpoint.pathname !== "/")
  ) {
    throw new Error("AWS_ENDPOINT_URL_S3 harus memakai endpoint HTTPS Neon.");
  }

  client = new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

function getReceiptsBucket(): string {
  const bucket = process.env.NEON_STORAGE_BUCKET_RECEIPTS;
  if (!bucket) throw new Error("NEON_STORAGE_BUCKET_RECEIPTS belum dikonfigurasi.");
  if (bucket !== "receipts") throw new Error("NEON_STORAGE_BUCKET_RECEIPTS harus bernilai receipts.");
  return bucket;
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  if (candidate.name === "NoSuchBucket") return false;
  return candidate.name === "NoSuchKey" || candidate.name === "NotFound" || candidate.$metadata?.httpStatusCode === 404;
}

export async function putReceiptObject(objectPath: string, data: Buffer, contentType: string): Promise<void> {
  await getClient().send(new PutObjectCommand({
    Bucket: getReceiptsBucket(),
    Key: objectPath,
    Body: data,
    ContentType: contentType,
  }));
}

export async function getReceiptObject(objectPath: string): Promise<Buffer | null> {
  try {
    const response = await getClient().send(new GetObjectCommand({
      Bucket: getReceiptsBucket(),
      Key: objectPath,
    }));
    if (!response.Body) return null;
    return Buffer.from(await response.Body.transformToByteArray());
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function deleteReceiptObject(objectPath: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({
    Bucket: getReceiptsBucket(),
    Key: objectPath,
  }));
}

export async function receiptObjectExists(objectPath: string): Promise<boolean> {
  try {
    await getClient().send(new HeadObjectCommand({
      Bucket: getReceiptsBucket(),
      Key: objectPath,
    }));
    return true;
  } catch (error) {
    if (isNotFound(error)) return false;
    throw error;
  }
}

export async function receiptBucketAvailable(): Promise<boolean> {
  try {
    await getClient().send(
      new HeadBucketCommand({ Bucket: getReceiptsBucket() }),
      { abortSignal: AbortSignal.timeout(5000) }
    );
    return true;
  } catch {
    return false;
  }
}
