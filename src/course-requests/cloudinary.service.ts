import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Returns a signed upload signature for client-side direct uploads.
   * NOTE: api_secret is NEVER included in the response — only the signature
   * (an HMAC of the params) and the public api_key are sent to the client.
   */
  getUploadSignature(folder = 'eduverse_courses') {
    const timestamp = Math.round(Date.now() / 1000);
    const upload_preset = 'eduverse_preset';

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder, upload_preset },
      this.configService.get<string>('CLOUDINARY_API_SECRET')!,
    );

    return {
      signature,
      timestamp,
      cloudName: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      apiKey: this.configService.get<string>('CLOUDINARY_API_KEY'),
      folder,
      upload_preset,
      // api_secret is intentionally NOT returned
    };
  }

  async deleteImage(imageUrl: string) {
    try {
      const parts = imageUrl.split('/');
      const filename = parts[parts.length - 1];
      const folder = parts[parts.length - 2];
      const publicId = `${folder}/${filename.split('.')[0]}`;

      return await cloudinary.uploader.destroy(publicId);
    } catch {
      throw new InternalServerErrorException(
        'ფაილის წაშლა Cloudinary-დან ვერ მოხერხდა',
      );
    }
  }
}
