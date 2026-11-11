import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config';

@Injectable()
export class CloudinaryClient {
  constructor() {
    if (
      env.cloudinary.cloudName &&
      env.cloudinary.apiKey &&
      env.cloudinary.apiSecret
    ) {
      cloudinary.config({
        cloud_name: env.cloudinary.cloudName,
        api_key: env.cloudinary.apiKey,
        api_secret: env.cloudinary.apiSecret,
        secure: true,
      });
    }
  }

  async uploadImage(file: Buffer, folder: string, publicId: string) {
    if (!env.cloudinary.cloudName)
      throw new BadRequestException('media storage is not configured');
    return new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, public_id: publicId, resource_type: 'image' },
          (error, value) =>
            error || !value
              ? reject(new Error(error?.message || 'Upload failed'))
              : resolve(value),
        );
        stream.end(file);
      },
    );
  }

  async uploadZip(file: Buffer, batchId: string) {
    if (!env.cloudinary.cloudName)
      throw new InternalServerErrorException('Cloudinary is not configured');
    return new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${env.production ? 'production' : 'development'}/batches`,
          public_id: batchId,
          resource_type: 'raw',
          format: 'zip',
        },
        (error, value) =>
          error || !value
            ? reject(new Error(error?.message || 'ZIP upload failed'))
            : resolve(value),
      );
      stream.end(file);
    });
  }

  async deleteResources(ids: string[]): Promise<void> {
    if (env.cloudinary.cloudName && ids.length)
      await cloudinary.api.delete_resources(ids).catch(() => undefined);
  }

  async deleteFolder(folder: string): Promise<void> {
    if (env.cloudinary.cloudName)
      await cloudinary.api.delete_folder(folder).catch(() => undefined);
  }
}
