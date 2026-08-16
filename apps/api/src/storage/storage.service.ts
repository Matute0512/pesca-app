import type { OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

/**
 * Cliente S3-compatible (MinIO en dev, R2/S3/B2 en prod).
 * Configurado por variables de entorno; nunca tokens en código.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(config: ConfigService) {
    const s3 = config.getOrThrow<{
      endpoint: string;
      region: string;
      bucket: string;
      accessKey: string;
      secretKey: string;
      forcePathStyle: boolean;
      publicUrl: string;
    }>('s3');

    this.bucket = s3.bucket;
    this.publicUrl = s3.publicUrl;
    this.client = new S3Client({
      endpoint: s3.endpoint,
      region: s3.region,
      forcePathStyle: s3.forcePathStyle,
      credentials: { accessKeyId: s3.accessKey, secretAccessKey: s3.secretKey },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureBucket();
    } catch (error) {
      this.logger.warn(`Storage no disponible en el arranque: ${(error as Error).message}`);
    }
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket "${this.bucket}" creado`);
    }
  }

  /** Sube un objeto y devuelve su URL pública. */
  async putObject(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string,
    opts?: { cacheControl?: string },
  ): Promise<{ key: string; url: string }> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: opts?.cacheControl ?? 'public, max-age=31536000',
      }),
    );
    return { key, url: `${this.publicUrl}/${key}` };
  }

  buildKey(prefix: string, filename: string): string {
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    return `${prefix}/${Date.now()}-${safe}`;
  }
}
